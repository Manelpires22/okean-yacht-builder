import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { metersToFeet } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  showConversion?: 'feet';
  allowNegative?: boolean;
}

/**
 * Input numérico estilo "caixa registradora" - digita da direita para esquerda
 * Exemplo: "0,00" → digita "1" → "0,01" → digita "7" → "0,17" → digita "4" → "1,74"
 */
export function NumericInput({
  value = '',
  onChange,
  decimals = 2,
  prefix = '',
  suffix = '',
  showConversion,
  allowNegative = false,
  className,
  disabled,
  ...props
}: NumericInputProps) {
  // Armazena valor interno como string de dígitos (sem formatação)
  const [internalValue, setInternalValue] = useState<string>('');

  // Sincronizar valor externo com interno quando componente monta ou valor muda
  useEffect(() => {
    if (value) {
      // Converter string do form (ex: "17.42") para centésimos (ex: "1742")
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const cents = Math.round(numValue * Math.pow(10, decimals));
        setInternalValue(cents.toString());
      }
    } else {
      setInternalValue('0');
    }
  }, [value, decimals]);

  // Formatar valor interno para exibição
  const formatDisplay = (digits: string): string => {
    if (!digits || digits === '0') {
      const zero = '0' + (decimals > 0 ? ',' + '0'.repeat(decimals) : '');
      return `${prefix}${prefix ? ' ' : ''}${zero}${suffix ? ' ' + suffix : ''}`;
    }

    // Preencher com zeros à esquerda se necessário
    const paddedDigits = digits.padStart(decimals + 1, '0');
    
    // Separar parte inteira e decimal
    const integerPart = paddedDigits.slice(0, -decimals) || '0';
    const decimalPart = decimals > 0 ? paddedDigits.slice(-decimals) : '';

    // Adicionar separadores de milhares
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Montar valor formatado
    const formatted = decimals > 0 
      ? `${formattedInteger},${decimalPart}`
      : formattedInteger;

    return `${prefix}${prefix ? ' ' : ''}${formatted}${suffix ? ' ' + suffix : ''}`;
  };

  // Converter valor interno para número
  const getNumericValue = (digits: string): number => {
    const num = parseInt(digits || '0', 10);
    return num / Math.pow(10, decimals);
  };

  // Handler para mudanças no input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const inputValue = e.target.value;
    
    // Extrair apenas dígitos
    const digitsOnly = inputValue.replace(/\D/g, '');
    
    if (!digitsOnly) {
      setInternalValue('0');
      onChange?.('0');
      return;
    }

    setInternalValue(digitsOnly);
    
    // Notificar mudança com valor numérico como string
    const numericValue = getNumericValue(digitsOnly);
    onChange?.(numericValue.toString());
  };

  // Handler para backspace/delete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      
      // Remover último dígito
      const newDigits = internalValue.slice(0, -1) || '0';
      setInternalValue(newDigits);
      
      const numericValue = getNumericValue(newDigits);
      onChange?.(numericValue.toString());
    }
  };

  const displayValue = formatDisplay(internalValue);
  const numericValue = getNumericValue(internalValue);
  const showFeetConversion = showConversion === 'feet' && numericValue > 0;

  return (
    <div className="space-y-2">
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn("font-mono", className)}
      />
      
      {showFeetConversion && (
        <Badge variant="outline" className="text-xs font-normal">
          📏 {metersToFeet(numericValue).toFixed(2)} ft
        </Badge>
      )}
    </div>
  );
}

// ========== VARIANTES ESPECIALIZADAS ==========

interface CurrencyInputProps extends Omit<NumericInputProps, 'prefix' | 'decimals'> {}

export function CurrencyInput(props: CurrencyInputProps) {
  return <NumericInput prefix="R$" decimals={2} {...props} />;
}

interface MeterInputProps extends Omit<NumericInputProps, 'suffix' | 'decimals' | 'showConversion'> {}

export function MeterInput(props: MeterInputProps) {
  return <NumericInput suffix="m" decimals={2} showConversion="feet" {...props} />;
}

interface LiterInputProps extends Omit<NumericInputProps, 'suffix' | 'decimals'> {}

export function LiterInput(props: LiterInputProps) {
  return <NumericInput suffix="L" decimals={0} {...props} />;
}

interface KilogramInputProps extends Omit<NumericInputProps, 'suffix' | 'decimals'> {}

export function KilogramInput(props: KilogramInputProps) {
  return <NumericInput suffix="kg" decimals={0} {...props} />;
}

interface KnotInputProps extends Omit<NumericInputProps, 'suffix' | 'decimals'> {}

export function KnotInput(props: KnotInputProps) {
  return <NumericInput suffix="nós" decimals={1} {...props} />;
}

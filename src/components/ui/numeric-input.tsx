import React, { useState, useEffect, useRef } from "react";
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
export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(({
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
}, ref) => {
  // Armazena valor interno como string de dígitos (sem formatação)
  // O valor recebido na prop 'value' JÁ É o valor correto (ex: "1500000" = 1.500.000)
  // Internamente armazenamos como centavos: "1500000" vira "150000000" para exibir "1.500.000,00"
  const [internalValue, setInternalValue] = useState<string>(() => {
    if (value && value !== '0') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // Multiplicar por 10^decimals para obter a unidade mínima (centavos)
        const minimalUnits = Math.round(numValue * Math.pow(10, decimals));
        return minimalUnits.toString();
      }
    }
    return '0';
  });

  // Flag para distinguir mudanças internas (usuário digitando) vs externas (importação)
  const isInternalChangeRef = useRef(false);

  // Sincronizar com mudanças externas (ex: importação de documentos)
  useEffect(() => {
    // Se mudança veio do usuário digitando, ignorar
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    // Apenas sincronizar mudanças EXTERNAS (importação, reset)
    if (value && value !== '0') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const expectedInternalValue = Math.round(numValue * Math.pow(10, decimals)).toString();
        setInternalValue(expectedInternalValue);
      }
    } else if (value === '0' || value === '') {
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
    let integerPart: string;
    let decimalPart: string;
    
    if (decimals === 0) {
      // Sem casas decimais: usar todos os dígitos como parte inteira
      // Remover zeros à esquerda desnecessários
      integerPart = paddedDigits.replace(/^0+/, '') || '0';
      decimalPart = '';
    } else {
      // Com casas decimais: separar parte inteira e decimal
      integerPart = paddedDigits.slice(0, -decimals) || '0';
      decimalPart = paddedDigits.slice(-decimals);
    }

    // Adicionar separadores de milhares apenas para valores monetários (com prefix)
    // Para unidades (dias, kg, L, etc) não usar separador
    const formattedInteger = prefix 
      ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      : integerPart;

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
    
    // Extrair apenas dígitos do input do usuário
    const digitsOnly = inputValue.replace(/\D/g, '');
    
    // Marcar como mudança interna (vinda do usuário)
    isInternalChangeRef.current = true;
    
    if (!digitsOnly) {
      setInternalValue('0');
      onChange?.('0');
      return;
    }

    // Atualizar valor interno (em unidades mínimas)
    setInternalValue(digitsOnly);
    
    // Converter para valor real e notificar
    const numericValue = getNumericValue(digitsOnly);
    onChange?.(numericValue.toString());
  };

  // Handler para backspace/delete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      
      // Marcar como mudança interna
      isInternalChangeRef.current = true;
      
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
        ref={ref}
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
});

NumericInput.displayName = "NumericInput";

// ========== VARIANTES ESPECIALIZADAS ==========

interface CurrencyInputProps extends Omit<NumericInputProps, 'prefix' | 'decimals'> {}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (props, ref) => {
    return <NumericInput ref={ref} prefix="R$" decimals={2} {...props} />;
  }
);
CurrencyInput.displayName = "CurrencyInput";

interface MeterInputProps extends Omit<NumericInputProps, 'suffix' | 'decimals' | 'showConversion'> {}

export const MeterInput = React.forwardRef<HTMLInputElement, MeterInputProps>(
  (props, ref) => {
    return <NumericInput ref={ref} suffix="m" decimals={2} showConversion="feet" {...props} />;
  }
);
MeterInput.displayName = "MeterInput";

interface LiterInputProps extends Omit<NumericInputProps, 'suffix' | 'decimals'> {}

export const LiterInput = React.forwardRef<HTMLInputElement, LiterInputProps>(
  (props, ref) => {
    return <NumericInput ref={ref} suffix="L" decimals={0} {...props} />;
  }
);
LiterInput.displayName = "LiterInput";

interface KilogramInputProps extends Omit<NumericInputProps, 'suffix' | 'decimals'> {}

export const KilogramInput = React.forwardRef<HTMLInputElement, KilogramInputProps>(
  (props, ref) => {
    return <NumericInput ref={ref} suffix="kg" decimals={0} {...props} />;
  }
);
KilogramInput.displayName = "KilogramInput";

interface KnotInputProps extends Omit<NumericInputProps, 'suffix' | 'decimals'> {}

export const KnotInput = React.forwardRef<HTMLInputElement, KnotInputProps>(
  (props, ref) => {
    return <NumericInput ref={ref} suffix="nós" decimals={1} {...props} />;
  }
);
KnotInput.displayName = "KnotInput";

interface NauticalMileInputProps extends Omit<NumericInputProps, 'suffix' | 'decimals'> {}

export const NauticalMileInput = React.forwardRef<HTMLInputElement, NauticalMileInputProps>(
  (props, ref) => {
    return <NumericInput ref={ref} suffix="mn" decimals={0} {...props} />;
  }
);
NauticalMileInput.displayName = "NauticalMileInput";

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MFAFactor {
  id: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  friendly_name?: string;
}

interface EnrollResponse {
  id: string;
  type: 'totp';
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export function useMFA() {
  const queryClient = useQueryClient();
  const [enrollmentData, setEnrollmentData] = useState<EnrollResponse | null>(null);

  // Get current MFA factors
  const { data: factors, isLoading: isLoadingFactors } = useQuery({
    queryKey: ['mfa-factors'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors() as { data: { totp: MFAFactor[] } | null, error: Error | null };
      if (error) throw error;
      return data.totp as MFAFactor[];
    },
  });

  // Get current assurance level
  const { data: assuranceLevel, isLoading: isLoadingLevel } = useQuery({
    queryKey: ['mfa-assurance-level'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      return data;
    },
  });

  // Check if user has MFA enabled
  const hasMFAEnabled = factors && factors.some(f => f.status === 'verified');

  // Start MFA enrollment
  const enrollMFA = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'OKEAN Yachts CPQ'
      });
      
      if (error) throw error;
      setEnrollmentData(data as EnrollResponse);
      return data as EnrollResponse;
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao iniciar configuração',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Verify TOTP and complete enrollment
  const verifyEnrollment = useMutation({
    mutationFn: async ({ factorId, code }: { factorId: string; code: string }) => {
      // Challenge the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      
      if (challengeError) throw challengeError;

      // Verify with the code
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setEnrollmentData(null);
      queryClient.invalidateQueries({ queryKey: ['mfa-factors'] });
      queryClient.invalidateQueries({ queryKey: ['mfa-assurance-level'] });
      toast({
        title: 'Autenticação em duas etapas ativada!',
        description: 'Sua conta agora está protegida com MFA.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Código inválido',
        description: 'Por favor, verifique o código e tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Verify MFA during login
  const verifyMFA = useMutation({
    mutationFn: async (code: string) => {
      const verifiedFactors = factors?.filter(f => f.status === 'verified') || [];
      if (verifiedFactors.length === 0) {
        throw new Error('Nenhum fator MFA encontrado');
      }

      const factorId = verifiedFactors[0].id;

      // Challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      
      if (challengeError) throw challengeError;

      // Verify
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-assurance-level'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Código inválido',
        description: 'Por favor, verifique o código e tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Unenroll MFA (remove factor)
  const unenrollMFA = useMutation({
    mutationFn: async (factorId: string) => {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-factors'] });
      queryClient.invalidateQueries({ queryKey: ['mfa-assurance-level'] });
      toast({
        title: 'Autenticação em duas etapas desativada',
        description: 'Sua conta não está mais protegida com MFA.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao desativar MFA',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Admin reset MFA for another user
  const adminResetMFA = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('reset-user-mfa', {
        body: { target_user_id: targetUserId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'MFA resetado',
        description: 'O utilizador precisará configurar o MFA novamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao resetar MFA',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    factors,
    isLoadingFactors,
    assuranceLevel,
    isLoadingLevel,
    hasMFAEnabled,
    enrollmentData,
    enrollMFA,
    verifyEnrollment,
    verifyMFA,
    unenrollMFA,
    adminResetMFA,
    cancelEnrollment: () => setEnrollmentData(null),
  };
}

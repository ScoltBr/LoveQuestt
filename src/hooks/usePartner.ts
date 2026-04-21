import { useProfile, useCouple } from './useProfile';

/**
 * Hook conveniente que retorna o perfil do parceiro(a),
 * eliminando a necessidade de duplicar a lógica em cada componente.
 */
export function usePartner() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: couple, isLoading: coupleLoading } = useCouple(profile?.couple_id || null);

  const partnerData = couple?.partner1?.id === profile?.id
    ? couple?.partner2
    : couple?.partner1;

  return {
    partnerData,
    couple,
    profile,
    isLoading: profileLoading || coupleLoading,
    hasPartner: !!partnerData,
    partnerId: partnerData?.id ?? null,
  };
}

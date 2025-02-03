
export interface RentDetails {
    originalLeaseAmount: number;
    originalLeaseTerm: number; // in months
    subleaseAmount: number;
  }
  
  export const calculateMonthlyRent = (
    leaseAmount: number,
    leaseTerm: number
  ): number => {
    if (!leaseTerm || leaseTerm === 0) return leaseAmount;
    return leaseAmount / leaseTerm;
  };
  
  export const calculateRentDifferential = (
    originalRent: number,
    subleaseRent: number
  ): number => {
    if (!originalRent || originalRent === 0) return 0;
    return ((subleaseRent - originalRent) / originalRent) * 100;
  };
  
  export const formatRentDifferential = (differential: number): string => {
    const prefix = differential < 0 ? '' : '+';
    return `${prefix}${differential.toFixed(1)}%`;
  };
  
  export const getRentComparisonLabel = (differential: number): string => {
    if (differential < 0) {
      return `${Math.abs(differential).toFixed(1)}% less than original lease`;
    } else if (differential > 0) {
      return `${differential.toFixed(1)}% more than original lease`;
    }
    return 'Same as original lease';
  };
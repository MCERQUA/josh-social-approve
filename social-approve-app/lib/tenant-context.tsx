'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Brand {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  oneup_category_id: number | null;
  color: string;
  logo_url: string | null;
  website_url: string | null;
}

interface Tenant {
  id: number;
  subdomain: string;
  name: string;
  email: string | null;
  logo_url: string | null;
  primary_color: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  brands: Brand[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  brands: [],
  loading: true,
  error: null,
  refetch: async () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tenant');
      if (!response.ok) {
        throw new Error('Failed to fetch tenant');
      }
      const data = await response.json();
      setTenant(data.tenant);
      setBrands(data.brands);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        brands,
        loading,
        error,
        refetch: fetchTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

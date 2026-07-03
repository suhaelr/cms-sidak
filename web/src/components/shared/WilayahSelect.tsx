import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { regionApi } from '@/lib/api';
import { apiQueryKey } from '@/lib/query-keys';
import SearchableSelect from '@/components/shared/SearchableSelect';

interface RegionOption {
  id: string;
  name: string;
}

export interface WilayahFormValues {
  provinsi: string;
  kabkota: string;
  kecamatan: string;
  desa: string;
}

export const emptyWilayah: WilayahFormValues = {
  provinsi: '',
  kabkota: '',
  kecamatan: '',
  desa: '',
};

export function wilayahToRegionId(values: WilayahFormValues): string | null {
  return values.desa || values.kecamatan || values.kabkota || values.provinsi || null;
}

function normalizeKodeDagri(kode: string): string {
  return kode.trim().replace(/\D/g, '');
}

function regionIdsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return !a && !b;
  return normalizeKodeDagri(a) === normalizeKodeDagri(b);
}

function withCurrentOption(options: RegionOption[], currentId: string): RegionOption[] {
  if (!currentId || options.some((o) => o.id === currentId)) return options;
  return [...options, { id: currentId, name: currentId }];
}

interface WilayahSelectProps {
  regionId?: string | null;
  onRegionIdChange: (regionId: string | null) => void;
  className?: string;
  /** When true, only show Provinsi and Kabupaten/Kota (e.g. berita CMS). */
  compact?: boolean;
}

const WilayahSelect = ({ regionId, onRegionIdChange, className, compact = false }: WilayahSelectProps) => {
  const [values, setValues] = useState<WilayahFormValues>(emptyWilayah);
  const [isHydrating, setIsHydrating] = useState(false);
  const onChangeRef = useRef(onRegionIdChange);
  onChangeRef.current = onRegionIdChange;
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const notifyParent = (next: WilayahFormValues) => {
    onChangeRef.current(wilayahToRegionId(next));
  };

  const { data: provinceRes } = useQuery({
    queryKey: apiQueryKey('/regions?type=province&limit=100', false),
    queryFn: () => regionApi.get<{ data: RegionOption[] }>('/regions?type=province&limit=100'),
  });
  const provinces = provinceRes?.data ?? [];

  const { data: cityRes } = useQuery({
    queryKey: apiQueryKey(`/regions?type=city&parent_id=${values.provinsi}&limit=100`, false),
    queryFn: () =>
      regionApi.get<{ data: RegionOption[] }>(`/regions?type=city&parent_id=${values.provinsi}&limit=100`),
    enabled: Boolean(values.provinsi) && !isHydrating,
  });
  const cities = cityRes?.data ?? [];

  const { data: districtRes } = useQuery({
    queryKey: apiQueryKey(`/regions?type=district&parent_id=${values.kabkota}&limit=100`, false),
    queryFn: () =>
      regionApi.get<{ data: RegionOption[] }>(`/regions?type=district&parent_id=${values.kabkota}&limit=100`),
    enabled: Boolean(values.kabkota) && !isHydrating,
  });
  const districts = districtRes?.data ?? [];

  const { data: villageRes } = useQuery({
    queryKey: apiQueryKey(`/regions?type=village&parent_id=${values.kecamatan}&limit=100`, false),
    queryFn: () =>
      regionApi.get<{ data: RegionOption[] }>(`/regions?type=village&parent_id=${values.kecamatan}&limit=100`),
    enabled: Boolean(values.kecamatan) && !isHydrating,
  });
  const villages = villageRes?.data ?? [];

  const { data: hierarchy } = useQuery({
    queryKey: apiQueryKey(`/regions/hierarchy/${regionId ?? ''}`, false),
    queryFn: () => regionApi.get<WilayahFormValues>(`/regions/hierarchy/${encodeURIComponent(regionId!)}`),
    enabled: Boolean(regionId) && !regionIdsEqual(regionId, wilayahToRegionId(valuesRef.current)),
  });

  useEffect(() => {
    if (!hierarchy) return;
    setIsHydrating(true);
    setValues(hierarchy);
    setIsHydrating(false);
  }, [hierarchy]);

  useEffect(() => {
    const selectedId = wilayahToRegionId(valuesRef.current);

    if (!regionId) {
      if (!selectedId) {
        setValues(emptyWilayah);
      }
      return;
    }

    if (regionIdsEqual(regionId, selectedId)) {
      return;
    }
  }, [regionId]);

  const update = (patch: Partial<WilayahFormValues>) => {
    setValues((prev) => {
      let next: WilayahFormValues;
      if (patch.provinsi !== undefined && patch.provinsi !== prev.provinsi) {
        next = { provinsi: patch.provinsi, kabkota: '', kecamatan: '', desa: '' };
      } else if (patch.kabkota !== undefined && patch.kabkota !== prev.kabkota) {
        next = { ...prev, kabkota: patch.kabkota, kecamatan: '', desa: '' };
      } else if (patch.kecamatan !== undefined && patch.kecamatan !== prev.kecamatan) {
        next = { ...prev, kecamatan: patch.kecamatan, desa: '' };
      } else {
        next = { ...prev, ...patch };
      }
      notifyParent(next);
      return next;
    });
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className ?? ''}`}>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Provinsi</label>
        <SearchableSelect
          value={values.provinsi}
          onValueChange={(provinsi) => update({ provinsi })}
          placeholder="Pilih Provinsi"
          options={[
            { value: '', label: 'Pilih Provinsi' },
            ...withCurrentOption(provinces, values.provinsi).map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          {compact ? 'Kota / Kabupaten' : 'Kabupaten/Kota'}
        </label>
        <SearchableSelect
          value={values.kabkota}
          onValueChange={(kabkota) => update({ kabkota })}
          placeholder="Pilih Kab/Kota"
          disabled={!values.provinsi}
          options={[
            { value: '', label: 'Pilih Kab/Kota' },
            ...withCurrentOption(cities, values.kabkota).map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
      </div>
      {!compact && (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kecamatan</label>
            <SearchableSelect
              value={values.kecamatan}
              onValueChange={(kecamatan) => update({ kecamatan })}
              placeholder="Pilih Kecamatan"
              disabled={!values.kabkota}
              options={[
                { value: '', label: 'Pilih Kecamatan' },
                ...withCurrentOption(districts, values.kecamatan).map((r) => ({ value: r.id, label: r.name })),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Desa/Kelurahan</label>
            <SearchableSelect
              value={values.desa}
              onValueChange={(desa) => update({ desa })}
              placeholder="Pilih Desa/Kelurahan"
              disabled={!values.kecamatan}
              options={[
                { value: '', label: 'Pilih Desa/Kelurahan' },
                ...withCurrentOption(villages, values.desa).map((r) => ({ value: r.id, label: r.name })),
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default WilayahSelect;

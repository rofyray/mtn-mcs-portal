"use client";

import { useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminBusinessesEmptyIcon } from "@/components/admin-empty-icons";
import MultiSelectDropdown from "@/components/multi-select-dropdown";
import { useToast } from "@/components/toast";
import { ghanaLocations } from "@/lib/ghana-locations";

type Business = {
  id: string;
  businessName: string;
  city: string;
  addressRegionCode: string;
  addressDistrictCode: string;
  status: string;
};

const statusOptions = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "DENIED", label: "Denied" },
  { value: "EXPIRED", label: "Expired" },
];

export default function AdminBusinessesPage() {
  const [status, setStatus] = useState("SUBMITTED");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  const statusLabel = statusOptions.find((option) => option.value === status)?.label ?? status;
  const statusLabelLower = statusLabel.toLowerCase();

  async function loadBusinesses(selectedStatus: string) {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/businesses?status=${selectedStatus}`);
    if (!response.ok) {
      setError("Unable to load businesses.");
      setLoading(false);
      return;
    }

    const data = await response.json();
    setBusinesses(data.businesses ?? []);
    setAdminRole(data.adminRole ?? null);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    const response = await fetch(`/api/admin/businesses/${id}/approve`, { method: "POST" });
    if (!response.ok) {
      setError("Unable to approve business.");
      notify({ title: "Approval failed", message: "Unable to approve business.", kind: "error" });
      return;
    }
    notify({ title: "Business approved", message: "Business status updated.", kind: "success" });
    loadBusinesses(status);
  }

  async function handleDeny(id: string) {
    const reason = window.prompt("Reason for denial?");
    if (!reason) {
      return;
    }
    const response = await fetch(`/api/admin/businesses/${id}/deny`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      setError("Unable to deny business.");
      notify({ title: "Denial failed", message: "Unable to deny business.", kind: "error" });
      return;
    }
    notify({ title: "Business denied", message: "Business status updated.", kind: "warning" });
    loadBusinesses(status);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBusinesses(status);
  }, [status]);

  const regionOptions = useMemo(() => {
    return Object.values(ghanaLocations).map((region) => ({
      value: region.code,
      label: region.name,
    }));
  }, []);

  const allDistrictOptions = useMemo(() => {
    return Object.values(ghanaLocations).flatMap((region) =>
      region.districts.map((district) => ({
        value: district.code,
        label: `${district.name} (${region.name})`,
        regionCode: region.code,
      }))
    );
  }, []);

  const districtOptions = useMemo(() => {
    if (selectedRegions.length === 0) {
      return [];
    }
    return allDistrictOptions
      .filter((district) => selectedRegions.includes(district.regionCode))
      .map(({ value, label }) => ({ value, label }));
  }, [allDistrictOptions, selectedRegions]);

  function handleRegionChange(nextRegions: string[]) {
    setSelectedRegions(nextRegions);
    const allowedDistricts =
      nextRegions.length === 0
        ? new Set(allDistrictOptions.map((district) => district.value))
        : new Set(
            allDistrictOptions
              .filter((district) => nextRegions.includes(district.regionCode))
              .map((district) => district.value)
          );
    setSelectedDistricts((prev) => prev.filter((district) => allowedDistricts.has(district)));
  }

  const cityOptions = useMemo(() => {
    return Array.from(new Set(businesses.map((business) => business.city))).sort();
  }, [businesses]);

  function getRegionName(code?: string | null) {
    if (!code) {
      return null;
    }
    return ghanaLocations[code]?.name ?? null;
  }

  function getDistrictName(regionCode?: string | null, districtCode?: string | null) {
    if (!regionCode || !districtCode) {
      return null;
    }
    return (
      ghanaLocations[regionCode]?.districts.find((district) => district.code === districtCode)
        ?.name ?? null
    );
  }

  const filteredBusinesses = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return businesses.filter((business) => {
      if (selectedCity && business.city !== selectedCity) {
        return false;
      }
      if (selectedRegions.length > 0 && !selectedRegions.includes(business.addressRegionCode)) {
        return false;
      }
      if (selectedDistricts.length > 0 && !selectedDistricts.includes(business.addressDistrictCode)) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return (
        business.businessName.toLowerCase().includes(normalizedSearch) ||
        business.city.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [businesses, searchQuery, selectedCity, selectedRegions, selectedDistricts]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 glass-panel p-6 page-animate panel-loading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Business Submissions</h1>
            <p className="text-sm text-gray-600">Review and approve new locations.</p>
          </div>
        </div>
        {loading ? <span className="panel-spinner" aria-label="Loading" /> : null}
        <div className="admin-filter-bar admin-filter-grid">
          <div className="admin-filter-field admin-filter-span-2">
            <label className="label" htmlFor="business-search">
              Search
            </label>
            <input
              id="business-search"
              className="input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Name or city"
              aria-label="Search businesses"
            />
          </div>
          <div className="admin-filter-field admin-filter-span-2">
            <label className="label" htmlFor="business-status">
              Status
            </label>
            <select
              id="business-status"
              className="input"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-filter-field admin-filter-span-2">
            <label className="label" htmlFor="business-city">
              City
            </label>
            <select
              id="business-city"
              className="input"
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
            >
              <option value="">All cities</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-filter-field admin-filter-span-3">
            <label className="label">Regions</label>
            <MultiSelectDropdown
              label="Regions"
              placeholder="All regions"
              options={regionOptions}
              selectedValues={selectedRegions}
              onChange={handleRegionChange}
            />
          </div>
          <div className="admin-filter-field admin-filter-span-3">
            <label className="label">Districts</label>
            <MultiSelectDropdown
              label="Districts"
              placeholder={selectedRegions.length > 0 ? "Select districts" : "Select regions first"}
              options={districtOptions}
              selectedValues={selectedDistricts}
              onChange={setSelectedDistricts}
              emptyLabel="Select a region to view districts"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        

        {filteredBusinesses.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<AdminBusinessesEmptyIcon />}
              title={
                searchQuery.trim() ||
                selectedCity ||
                selectedRegions.length > 0 ||
                selectedDistricts.length > 0
                  ? `No ${statusLabelLower} businesses match those filters`
                  : status === "SUBMITTED"
                    ? "No businesses submitted yet"
                    : `No ${statusLabelLower} businesses yet`
              }
              description={
                searchQuery.trim() ||
                selectedCity ||
                selectedRegions.length > 0 ||
                selectedDistricts.length > 0
                  ? "Try adjusting the search or location filters."
                  : status === "SUBMITTED"
                    ? "New business submissions will appear here."
                    : `Once businesses are ${statusLabelLower}, they'll appear here.`
              }
              variant="inset"
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 stagger">
            {filteredBusinesses.map((business) => (
              <div key={business.id} className="rounded border p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{business.status}</p>
                  <p className="text-sm font-medium">{business.businessName}</p>
                  <p className="text-xs text-gray-600">{business.city}</p>
                  {business.addressRegionCode && business.addressDistrictCode ? (
                    <>
                      <p className="text-xs text-gray-600">
                        {getRegionName(business.addressRegionCode) ?? "Region"} ·{" "}
                        {getDistrictName(business.addressRegionCode, business.addressDistrictCode) ?? "District"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Codes: {business.addressRegionCode} · {business.addressDistrictCode}
                      </p>
                    </>
                  ) : null}
                </div>
                {adminRole ? (
                  adminRole === "FULL" ? (
                    <a className="btn btn-secondary" href={`/admin/businesses/${business.id}`}>
                      View details
                    </a>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <a className="btn btn-secondary" href={`/admin/businesses/${business.id}`}>
                        View & edit
                      </a>
                      {business.status === "SUBMITTED" ? (
                        <>
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => handleApprove(business.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger-light"
                            type="button"
                            onClick={() => handleDeny(business.id)}
                          >
                            Deny
                          </button>
                        </>
                      ) : null}
                    </div>
                  )
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

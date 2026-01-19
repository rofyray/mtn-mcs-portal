"use client";

import { useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminPartnersEmptyIcon } from "@/components/admin-empty-icons";
import MultiSelectDropdown from "@/components/multi-select-dropdown";
import { useToast } from "@/components/toast";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { ghanaLocations } from "@/lib/ghana-locations";

type PartnerProfile = {
  id: string;
  status: string;
  businessName: string | null;
  partnerFirstName: string | null;
  partnerSurname: string | null;
  phoneNumber: string | null;
  addressCode: string | null;
  addressRegionCode: string | null;
  addressDistrictCode: string | null;
  submittedAt: string | null;
  updatedAt: string;
  user: { id: string; name: string | null; email: string | null };
};

const statusOptions = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "DENIED", label: "Denied" },
  { value: "DRAFT", label: "Draft" },
  { value: "EXPIRED", label: "Expired" },
];

export default function AdminPartnersPage() {
  const [status, setStatus] = useState("SUBMITTED");
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  const { confirm, confirmDialog, getInputValue } = useConfirmDialog();
  const statusLabel = statusOptions.find((option) => option.value === status)?.label ?? status;
  const statusLabelLower = statusLabel.toLowerCase();

  async function loadPartners(selectedStatus: string) {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/partners?status=${selectedStatus}`);
    if (!response.ok) {
      setError("Unable to load partners.");
      setLoading(false);
      return;
    }

    const data = await response.json();
    setPartners(data.partners ?? []);
    setAdminRole(data.adminRole ?? null);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    const confirmed = await confirm({
      title: "Approve partner?",
      description: "This will mark the submission as approved.",
      confirmLabel: "Approve",
      confirmVariant: "primary",
    });
    if (!confirmed) {
      return;
    }
    const response = await fetch(`/api/admin/partners/${id}/approve`, { method: "POST" });
    if (!response.ok) {
      setError("Unable to approve partner.");
      notify({ title: "Approval failed", message: "Unable to approve partner.", kind: "error" });
      return;
    }
    notify({ title: "Partner approved", message: "Partner status updated.", kind: "success" });
    loadPartners(status);
  }

  async function handleDeny(id: string) {
    const confirmed = await confirm({
      title: "Deny partner?",
      description: "Provide a reason for denying this submission.",
      confirmLabel: "Deny",
      confirmVariant: "danger",
      inputLabel: "Reason for denial",
      inputPlaceholder: "Add a brief reason",
      inputRequired: true,
    });
    if (!confirmed) {
      return;
    }
    const reason = getInputValue().trim();
    if (!reason) {
      return;
    }
    const response = await fetch(`/api/admin/partners/${id}/deny`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      setError("Unable to deny partner.");
      notify({ title: "Denial failed", message: "Unable to deny partner.", kind: "error" });
      return;
    }
    notify({ title: "Partner denied", message: "Partner status updated.", kind: "warning" });
    loadPartners(status);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPartners(status);
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

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      if (selectedRegions.length > 0 && partner.addressRegionCode) {
        if (!selectedRegions.includes(partner.addressRegionCode)) {
          return false;
        }
      }
      if (selectedDistricts.length > 0 && partner.addressDistrictCode) {
        if (!selectedDistricts.includes(partner.addressDistrictCode)) {
          return false;
        }
      }
      return true;
    });
  }, [partners, selectedRegions, selectedDistricts]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 glass-panel p-6 page-animate panel-loading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Partner Submissions</h1>
            <p className="text-sm text-gray-600">Review and manage onboarding submissions.</p>
          </div>
        </div>
        {loading ? <span className="panel-spinner" aria-label="Loading" /> : null}
        <div className="admin-filter-bar">
          <div className="admin-filter-field">
            <label className="label" htmlFor="partner-status">
              Status
            </label>
            <select
              id="partner-status"
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
          <div className="admin-filter-field">
            <label className="label">Regions</label>
            <MultiSelectDropdown
              label="Regions"
              placeholder="All regions"
              options={regionOptions}
              selectedValues={selectedRegions}
              onChange={handleRegionChange}
            />
          </div>
          <div className="admin-filter-field">
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
        

        {filteredPartners.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<AdminPartnersEmptyIcon />}
              title={
                selectedRegions.length > 0 || selectedDistricts.length > 0
                  ? `No ${statusLabelLower} partners match those filters`
                  : status === "SUBMITTED"
                    ? "No partner submissions yet"
                    : `No ${statusLabelLower} partners yet`
              }
              description={
                selectedRegions.length > 0 || selectedDistricts.length > 0
                  ? "Try adjusting the region or district filters."
                  : status === "SUBMITTED"
                    ? "New partner onboarding requests will show here."
                    : status === "DRAFT"
                      ? "Once partners start drafts, they'll appear here."
                      : `Once partners are ${statusLabelLower}, they'll appear here.`
              }
              variant="inset"
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 justify-items-start stagger">
            {filteredPartners.map((partner) => (
              <div key={partner.id} className="card partner-card space-y-3">
                <div className="space-y-1">
                  <span
                    className={`badge badge-${
                      partner.status === "APPROVED"
                        ? "success"
                        : partner.status === "DENIED"
                          ? "error"
                          : partner.status === "EXPIRED"
                            ? "warning"
                            : "info"
                    }`}
                  >
                    {partner.status}
                  </span>
                  <h2 className="text-lg font-semibold">
                    {partner.businessName ?? "Business Name Pending"}
                  </h2>
                  <p className="text-sm">
                    {partner.partnerFirstName} {partner.partnerSurname}
                  </p>
                  <p className="text-sm text-gray-600">{partner.phoneNumber}</p>
                  <p className="text-xs text-gray-500">
                    {partner.addressCode ?? "Digital address pending"}
                  </p>
                </div>

                {adminRole ? (
                  adminRole === "FULL" ? (
                    <div className="pt-2">
                      <a className="btn btn-secondary" href={`/admin/partners/${partner.id}`}>
                        View details
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <a className="btn btn-secondary" href={`/admin/partners/${partner.id}`}>
                        View & edit
                      </a>
                      {partner.status === "SUBMITTED" ? (
                        <>
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => handleApprove(partner.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger-light"
                            type="button"
                            onClick={() => handleDeny(partner.id)}
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
      {confirmDialog}
    </main>
  );
}

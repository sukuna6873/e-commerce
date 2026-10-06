import { useState } from "react";
import type { Address } from "../../types";
import { useStore } from "../../store/StoreContext";
import { SEED_ADDRESSES } from "../../data/seed";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Modal,
  inputClass,
} from "../../components/Primitives";
import { EditIcon, PlusIcon, ReturnIcon, TrashIcon } from "../../components/Icons";

interface FormState {
  label: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
  phone: string;
}

const EMPTY_FORM: FormState = {
  label: "Home",
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postcode: "",
  country: "United States",
  phone: "",
};

export function AccountAddressesPage() {
  const { user, addresses, saveAddress, removeAddress, notify } = useStore();
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState<Address | null>(null);

  // Seeded demo addresses belong to the account but live in the data module,
  // not localStorage, so they're shown alongside the shopper's own.
  const seeded = SEED_ADDRESSES.filter((a) => a.userId === user?.id);
  const all = [...seeded, ...addresses];

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setCreating(true);
  };

  const openEdit = (address: Address) => {
    setForm({
      label: address.label,
      fullName: address.fullName,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      region: address.region,
      postcode: address.postcode,
      country: address.country,
      phone: address.phone,
    });
    setErrors({});
    setEditing(address);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.label.trim()) next.label = "Required";
    if (!form.fullName.trim()) next.fullName = "Required";
    if (!form.line1.trim()) next.line1 = "Required";
    if (!form.city.trim()) next.city = "Required";
    if (!form.region.trim()) next.region = "Required";
    if (form.postcode.trim().length < 3) next.postcode = "Required";
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = "Enter a contact number";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await saveAddress({
      id: editing?.id ?? `a-${Date.now().toString(36)}`,
      userId: user?.id ?? "guest",
      label: form.label.trim(),
      fullName: form.fullName.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      region: form.region.trim(),
      postcode: form.postcode.trim(),
      country: form.country,
      phone: form.phone.trim(),
      isDefault: editing?.isDefault ?? all.length === 0,
    });
    notify(editing ? "Address updated" : "Address saved");
    close();
  };

  const modalOpen = creating || editing !== null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-fg">Addresses</h2>
          <p className="text-sm text-fg-3">
            Saved for faster checkout. Addresses are stored in this browser only.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <PlusIcon size={16} />
          Add address
        </Button>
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={<ReturnIcon size={22} />}
          title="No saved addresses"
          description="Save an address and it will be offered automatically at checkout."
          action={<Button onClick={openCreate}>Add your first address</Button>}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {all.map((address) => {
            const isSeeded = !address.id.startsWith("a-") || !addresses.some((a) => a.id === address.id);
            return (
              <li
                key={address.id}
                className="flex flex-col rounded-2xl border border-line bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg">{address.label}</span>
                    {address.isDefault && <Badge tone="accent">Default</Badge>}
                  </span>
                </div>

                <address className="mt-2.5 flex-1 text-sm not-italic leading-relaxed text-fg-2">
                  {address.fullName}
                  <br />
                  {address.line1}
                  {address.line2 && <>, {address.line2}</>}
                  <br />
                  {address.city}, {address.region} {address.postcode}
                  <br />
                  {address.country}
                  <br />
                  {address.phone}
                </address>

                <div className="mt-4 flex gap-2 border-t border-line pt-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(address)}>
                    <EditIcon size={14} />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(address)}
                    className="hover:text-danger"
                  >
                    <TrashIcon size={14} />
                    Remove
                  </Button>
                </div>

                {isSeeded && (
                  <p className="mt-2 text-xs text-fg-3">
                    Demo address — editing it saves a copy you own.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Add / edit */}
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Edit address" : "Add an address"}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={close} className="flex-1">
              Cancel
            </Button>
            <Button onClick={submit} className="flex-1">
              {editing ? "Save changes" : "Add address"}
            </Button>
          </div>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Label" htmlFor="addr-label" error={errors.label} required>
            <input
              id="addr-label"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Home, Office…"
              className={inputClass(Boolean(errors.label))}
            />
          </Field>

          <Field label="Full name" htmlFor="addr-name" error={errors.fullName} required>
            <input
              id="addr-name"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              className={inputClass(Boolean(errors.fullName))}
              autoComplete="name"
            />
          </Field>

          <Field label="Address" htmlFor="addr-line1" error={errors.line1} required>
            <input
              id="addr-line1"
              value={form.line1}
              onChange={(e) => set("line1", e.target.value)}
              className={inputClass(Boolean(errors.line1))}
              autoComplete="address-line1"
            />
          </Field>

          <Field label="Apartment, suite (optional)" htmlFor="addr-line2">
            <input
              id="addr-line2"
              value={form.line2}
              onChange={(e) => set("line2", e.target.value)}
              className={inputClass(false)}
              autoComplete="address-line2"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" htmlFor="addr-city" error={errors.city} required>
              <input
                id="addr-city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className={inputClass(Boolean(errors.city))}
                autoComplete="address-level2"
              />
            </Field>
            <Field label="State / region" htmlFor="addr-region" error={errors.region} required>
              <input
                id="addr-region"
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
                className={inputClass(Boolean(errors.region))}
                autoComplete="address-level1"
              />
            </Field>
            <Field label="Postcode" htmlFor="addr-postcode" error={errors.postcode} required>
              <input
                id="addr-postcode"
                value={form.postcode}
                onChange={(e) => set("postcode", e.target.value)}
                className={inputClass(Boolean(errors.postcode))}
                autoComplete="postal-code"
              />
            </Field>
            <Field label="Country" htmlFor="addr-country">
              <input
                id="addr-country"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className={inputClass(false)}
                autoComplete="country-name"
              />
            </Field>
          </div>

          <Field label="Phone" htmlFor="addr-phone" error={errors.phone} required>
            <input
              id="addr-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass(Boolean(errors.phone))}
              autoComplete="tel"
            />
          </Field>

          {/* Lets the Enter key submit without a visible duplicate button. */}
          <button type="submit" className="sr-only" aria-hidden tabIndex={-1} />
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Remove this address?"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmDelete(null)}
            >
              Keep it
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={async () => {
                if (!confirmDelete) return;
                await removeAddress(confirmDelete.id);
                notify("Address removed");
                setConfirmDelete(null);
              }}
            >
              Remove address
            </Button>
          </div>
        }
      >
        <p className="text-sm text-fg-2">
          {confirmDelete?.label} — {confirmDelete?.line1}, {confirmDelete?.city}. This can’t be
          undone.
        </p>
      </Modal>
    </div>
  );
}
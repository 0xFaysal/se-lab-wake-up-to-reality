"use client";

import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  PageEmptyState,
  PageErrorState,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financeApi } from "@/lib/api/finance-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { PayoutMethodDto } from "@/lib/api/marketplace-types";

const queryKey = ["provider", "payout-methods"] as const;

export default function PayoutMethodsPage() {
  const client = useQueryClient();
  const [adding, setAdding] = useState(false);
  const methods = useQuery({ queryKey, queryFn: financeApi.payoutMethods });
  const refresh = () => client.invalidateQueries({ queryKey });
  const create = useMutation({
    mutationFn: financeApi.createPayoutMethod,
    onSuccess: async () => {
      toast.success("Payout method added securely");
      setAdding(false);
      await refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const makeDefault = useMutation({
    mutationFn: financeApi.setDefaultPayoutMethod,
    onSuccess: async () => {
      toast.success("Default payout method updated");
      await refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const deactivate = useMutation({
    mutationFn: financeApi.deactivatePayoutMethod,
    onSuccess: async () => {
      toast.success("Payout method deactivated");
      await refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (methods.isError)
    return (
      <ProviderPage>
        <PageErrorState
          message={getApiErrorMessage(methods.error)}
          retry={() => void methods.refetch()}
        />
      </ProviderPage>
    );
  return (
    <ProviderPage className="max-w-5xl">
      <ProviderPageHeader
        title="Payout methods"
        description="Manage bank and mobile-wallet destinations. Full account identifiers are encrypted and never shown again."
        breadcrumbs={[
          { label: "Settings", href: "/provider/settings" },
          { label: "Payout methods" },
        ]}
        actions={
          <Button onClick={() => setAdding((value) => !value)}>
            <Plus className="size-4" />
            Add method
          </Button>
        }
      />
      {adding && (
        <PayoutMethodForm
          pending={create.isPending}
          submit={(input) => create.mutate(input)}
          cancel={() => setAdding(false)}
        />
      )}
      {methods.isPending ? (
        <div className="h-36 animate-pulse border bg-slate-100" />
      ) : methods.data.length === 0 ? (
        <PageEmptyState
          title="No payout method"
          description="Add a verified bank account or mobile wallet before requesting a payout."
        />
      ) : (
        <div className="divide-y border bg-white">
          {methods.data.map((method) => (
            <article
              key={method.id}
              className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
            >
              <div className="flex gap-3">
                <span className="flex size-10 items-center justify-center bg-emerald-50 text-emerald-800">
                  <CreditCard className="size-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{method.type.replaceAll("_", " ")}</strong>
                    {method.isDefault && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="size-3" />
                        Default
                      </span>
                    )}
                    <span className="bg-slate-100 px-2 py-1 text-[10px] font-bold">
                      {method.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {method.accountHolderName} ·{" "}
                    {method.maskedAccountIdentifier}
                  </p>
                  {method.bankName && (
                    <p className="text-xs text-slate-500">
                      {method.bankName}
                      {method.branchName ? ` · ${method.branchName}` : ""}
                    </p>
                  )}
                </div>
              </div>
              {method.status === "ACTIVE" && (
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={makeDefault.isPending}
                      onClick={() => makeDefault.mutate(method.id)}
                    >
                      Set default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deactivate.isPending}
                    onClick={() => deactivate.mutate(method.id)}
                  >
                    Deactivate
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </ProviderPage>
  );
}

function PayoutMethodForm({
  pending,
  submit,
  cancel,
}: {
  pending: boolean;
  submit: (input: Parameters<typeof financeApi.createPayoutMethod>[0]) => void;
  cancel: () => void;
}) {
  const [type, setType] = useState<PayoutMethodDto["type"]>("BANK");
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    submit({
      type,
      accountHolderName: String(data.get("accountHolderName")),
      accountIdentifier: String(data.get("accountIdentifier")),
      ...(type === "BANK"
        ? {
            bankName: String(data.get("bankName")),
            branchName: String(data.get("branchName") || "") || undefined,
            routingNumber: String(data.get("routingNumber") || "") || undefined,
          }
        : {}),
      isDefault: data.get("isDefault") === "on",
    });
  }
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="grid gap-4 border border-emerald-200 bg-emerald-50 p-5 sm:grid-cols-2"
    >
      <label className="space-y-1 text-sm font-semibold">
        Destination type
        <select
          className="h-10 w-full border bg-white px-3"
          value={type}
          onChange={(event) =>
            setType(event.target.value as PayoutMethodDto["type"])
          }
        >
          <option value="BANK">Bank account</option>
          <option value="BKASH">bKash</option>
          <option value="NAGAD">Nagad</option>
          <option value="ROCKET">Rocket</option>
          <option value="OTHER_MFS">Other mobile wallet</option>
        </select>
      </label>
      <label className="space-y-1 text-sm font-semibold">
        Account holder name
        <Input
          name="accountHolderName"
          minLength={2}
          maxLength={120}
          required
        />
      </label>
      <label className="space-y-1 text-sm font-semibold">
        {type === "BANK" ? "Account number" : "Mobile wallet number"}
        <Input
          name="accountIdentifier"
          minLength={6}
          maxLength={100}
          required
          autoComplete="off"
        />
      </label>
      {type === "BANK" && (
        <>
          <label className="space-y-1 text-sm font-semibold">
            Bank name
            <Input name="bankName" minLength={2} maxLength={120} required />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            Branch name
            <Input name="branchName" maxLength={120} />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            Routing number
            <Input name="routingNumber" maxLength={40} />
          </label>
        </>
      )}
      <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
        <input type="checkbox" name="isDefault" />
        Use as default payout method
      </label>
      <p className="text-xs leading-5 text-emerald-900 sm:col-span-2">
        The identifier is encrypted before storage. After creation, only a
        masked value is returned.
      </p>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}Save payout
          method
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={cancel}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

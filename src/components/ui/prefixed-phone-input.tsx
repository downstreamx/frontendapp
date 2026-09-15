import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/components/ui/input-error";
import { dialCodeForCountry } from "@/lib/phone-country";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  label?: string;
  country: string;
  /** National number only (no country code). */
  value: string;
  onChange: (national: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function PrefixedPhoneInput({
  id = "mobile_no",
  label,
  country,
  value,
  onChange,
  error,
  required,
  disabled,
  className,
}: Props) {
  const { t } = useTranslation();
  const dial = dialCodeForCountry(country);

  return (
    <div className={cn(className)}>
      {label ? (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      ) : null}
      <div className="flex overflow-hidden rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring">
        <span className="inline-flex items-center border-r border-input bg-muted/50 px-3 text-sm text-muted-foreground tabular-nums">
          {dial}
        </span>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d\s-]/g, ""))}
          placeholder={t("8012345678")}
          required={required}
          disabled={disabled}
          className="border-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <InputError message={error} />
    </div>
  );
}

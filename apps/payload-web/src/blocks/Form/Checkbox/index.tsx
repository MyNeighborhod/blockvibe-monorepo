import type { CheckboxField } from "@payloadcms/plugin-form-builder/types"
import type { FieldErrorsImpl, FieldValues, UseFormRegister } from "react-hook-form"

import { useFormContext } from "react-hook-form"

import { Checkbox as CheckboxUi } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import React from "react"

import { Error } from "../Error"
import { Width } from "../Width"

export const Checkbox: React.FC<
  CheckboxField & {
    errors: Partial<FieldErrorsImpl>
    register: UseFormRegister<FieldValues>
  }
> = ({ name, defaultValue, errors, label, register, required, width }) => {
  const { setValue } = useFormContext()

  register(name, {
    required: required ? "This field is required" : false,
    validate: (value) => !required || value === true || "This field is required",
  })

  return (
    <Width width={width}>
      <div className="flex items-center gap-2">
        <CheckboxUi
          defaultChecked={defaultValue}
          id={name}
          name={name}
          onCheckedChange={(checked) => {
            setValue(name, checked === true, { shouldDirty: true, shouldValidate: true })
          }}
        />
        <Label htmlFor={name}>
          {label}
          {required && (
            <span className="required">
              {" "}
              * <span className="sr-only">(required)</span>
            </span>
          )}
        </Label>
      </div>
      {errors[name] && <Error name={name} />}
    </Width>
  )
}

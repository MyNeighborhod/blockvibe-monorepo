"use client"
import type { Form } from "@/payload-types"

import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import RichText from "@/components/RichText"
import { Button } from "@/components/ui/button"
import type { DefaultTypedEditorState } from "@payloadcms/richtext-lexical"

import { fields } from "./fields"
import { getClientSideURL } from "@/utilities/getURL"

export type FormBlockForm = Pick<
  Form,
  | "id"
  | "fields"
  | "submitButtonLabel"
  | "confirmationType"
  | "confirmationMessage"
  | "confirmationMessageDuration"
  | "redirect"
>

export type FormBlockType = {
  blockName?: string
  blockType?: "formBlock"
  enableIntro: boolean
  form: FormBlockForm
  introContent?: DefaultTypedEditorState
}

export const FormBlock: React.FC<
  {
    id?: string
  } & FormBlockType
> = (props) => {
  const {
    enableIntro,
    form: formFromProps,
    form: { id: formID, confirmationMessage, confirmationMessageDuration, confirmationType, redirect, submitButtonLabel } = {},
    introContent,
  } = props

  const formMethods = useForm({
    defaultValues: {},
  })
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = formMethods

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()
  const router = useRouter()

  const formElementId = formID != null ? String(formID) : undefined

  useEffect(() => {
    if (!hasSubmitted || confirmationType !== "message") return

    const durationSeconds = confirmationMessageDuration ?? 5
    if (durationSeconds <= 0) return

    const timerId = setTimeout(() => {
      setHasSubmitted(false)
      reset()
    }, durationSeconds * 1000)

    return () => clearTimeout(timerId)
  }, [hasSubmitted, confirmationType, confirmationMessageDuration, reset])

  const onSubmit = useCallback(
    (data: Record<string, unknown>) => {
      let loadingTimerID: ReturnType<typeof setTimeout>
      const submitForm = async () => {
        setError(undefined)

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }))

        // delay loading indicator by 1s
        loadingTimerID = setTimeout(() => {
          setIsLoading(true)
        }, 1000)

        try {
          const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          })

          const res = await req.json()

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)

            setError({
              message: res.errors?.[0]?.message || "Internal Server Error",
              status: res.status,
            })

            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (confirmationType === "redirect" && redirect) {
            const { url } = redirect

            const redirectUrl = url

            if (redirectUrl) router.push(redirectUrl)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: "Something went wrong.",
          })
        }
      }

      void submitForm()
    },
    [router, formID, redirect, confirmationType],
  )

  return (
    <div className="container lg:max-w-[48rem]">
      {enableIntro && introContent && !hasSubmitted && (
        <RichText className="mb-8 lg:mb-12" data={introContent} enableGutter={false} />
      )}
      <div className="p-4 lg:p-6 border border-border rounded-[0.8rem]">
        <FormProvider {...formMethods}>
          {!isLoading && hasSubmitted && confirmationType === "message" && confirmationMessage && (
            <div className="form-confirmation-message" role="status" aria-live="polite">
              <RichText
                data={confirmationMessage as DefaultTypedEditorState}
                enableGutter={false}
                enableProse={false}
              />
            </div>
          )}
          {isLoading && !hasSubmitted && <p>Loading, please wait...</p>}
          {error && <div>{`${error.status || "500"}: ${error.message || ""}`}</div>}
          {!hasSubmitted && (
            <form id={formElementId} onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4 last:mb-0">
                {formFromProps &&
                  formFromProps.fields &&
                  formFromProps.fields?.map((field, index) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
                    if (Field) {
                      return (
                        <div className="mb-6 last:mb-0" key={index}>
                          <Field
                            form={formFromProps}
                            {...field}
                            {...formMethods}
                            control={control}
                            errors={errors}
                            register={register}
                          />
                        </div>
                      )
                    }
                    return null
                  })}
              </div>

              <Button form={formElementId} type="submit" variant="default">
                {submitButtonLabel}
              </Button>
            </form>
          )}
        </FormProvider>
      </div>
    </div>
  )
}

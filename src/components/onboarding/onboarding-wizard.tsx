"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { onboardingSteps, type OnboardingField } from "@/config/onboarding-questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

// Step data key mapping
const STEP_KEYS = [
  "brandInfo",
  "goals",
  "targetAudience",
  "currentState",
  "competitors",
] as const;

type StepKey = (typeof STEP_KEYS)[number];

type FormData = Record<StepKey, Record<string, string>> & {
  additionalNotes: string;
};

interface OnboardingWizardProps {
  initialData?: {
    brandId?: string;
    currentStep?: number;
    brandInfo?: Record<string, string>;
    goals?: Record<string, string>;
    targetAudience?: Record<string, string>;
    currentState?: Record<string, string>;
    competitors?: Record<string, string>;
    additionalNotes?: string;
  };
}

export function OnboardingWizard({ initialData }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(
    initialData?.currentStep ?? 1
  );
  const [brandId, setBrandId] = useState<string | undefined>(
    initialData?.brandId
  );
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    brandInfo: initialData?.brandInfo ?? {},
    goals: initialData?.goals ?? {},
    targetAudience: initialData?.targetAudience ?? {},
    currentState: initialData?.currentState ?? {},
    competitors: initialData?.competitors ?? {},
    additionalNotes: initialData?.additionalNotes ?? "",
  });

  const totalSteps = onboardingSteps.length + 1; // +1 for review step
  const progress = (currentStep / totalSteps) * 100;

  const updateField = useCallback(
    (stepKey: StepKey, fieldName: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [stepKey]: {
          ...prev[stepKey],
          [fieldName]: value,
        },
      }));
    },
    []
  );

  const saveProgress = useCallback(
    async (isComplete = false) => {
      setSaving(true);
      try {
        const response = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandId,
            currentStep,
            brandInfo: formData.brandInfo,
            goals: formData.goals,
            targetAudience: formData.targetAudience,
            currentState: formData.currentState,
            competitors: formData.competitors,
            additionalNotes: formData.additionalNotes,
            isComplete,
          }),
        });

        if (!response.ok) throw new Error("Failed to save");

        const result = await response.json();
        if (result.brand?.id) {
          setBrandId(result.brand.id);
        }

        if (isComplete) {
          toast.success("Onboarding complete! Your brand data has been saved.");
          router.push("/dashboard");
        } else {
          toast.success("Progress saved");
        }
      } catch {
        toast.error("Failed to save. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [brandId, currentStep, formData, router]
  );

  const goNext = useCallback(async () => {
    await saveProgress(false);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [saveProgress, totalSteps]);

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    await saveProgress(true);
  }, [saveProgress]);

  // Render a single form field
  const renderField = (
    field: OnboardingField,
    stepKey: StepKey,
    value: string
  ) => {
    const id = `${stepKey}-${field.name}`;
    return (
      <div key={id} className="space-y-2">
        <Label htmlFor={id}>
          {field.label}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        {field.type === "textarea" ? (
          <Textarea
            id={id}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => updateField(stepKey, field.name, e.target.value)}
            rows={3}
          />
        ) : field.type === "select" && field.options ? (
          <Select
            value={value}
            onValueChange={(v) => updateField(stepKey, field.name, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={id}
            type={field.type === "url" ? "url" : "text"}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => updateField(stepKey, field.name, e.target.value)}
          />
        )}
      </div>
    );
  };

  // Review step
  const renderReview = () => (
    <div className="space-y-6">
      {onboardingSteps.map((step, idx) => {
        const stepKey = STEP_KEYS[idx];
        const data = formData[stepKey];
        return (
          <div key={step.id} className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{step.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(step.id)}
              >
                Edit
              </Button>
            </div>
            <div className="space-y-1">
              {step.fields.map((field) => {
                const val = data[field.name];
                if (!val) return null;
                return (
                  <div key={field.name} className="text-sm">
                    <span className="font-medium text-muted-foreground">
                      {field.label}:
                    </span>{" "}
                    {val}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {formData.additionalNotes && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">Additional Notes</h3>
          <p className="text-sm">{formData.additionalNotes}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="additional-notes">
          Additional Notes (optional)
        </Label>
        <Textarea
          id="additional-notes"
          placeholder="Anything else we should know?"
          value={formData.additionalNotes}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              additionalNotes: e.target.value,
            }))
          }
          rows={3}
        />
      </div>
    </div>
  );

  const isReviewStep = currentStep === totalSteps;
  const currentStepConfig = !isReviewStep
    ? onboardingSteps[currentStep - 1]
    : null;
  const currentStepKey = !isReviewStep
    ? STEP_KEYS[currentStep - 1]
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} />
        <div className="flex gap-1">
          {[...Array(totalSteps)].map((_, i) => (
            <Badge
              key={i}
              variant={i + 1 <= currentStep ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setCurrentStep(i + 1)}
            >
              {i + 1 < totalSteps
                ? onboardingSteps[i]?.title ?? "Review"
                : "Review"}
            </Badge>
          ))}
        </div>
      </div>

      {/* Step Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isReviewStep
              ? "Review & Submit"
              : currentStepConfig?.title}
          </CardTitle>
          <CardDescription>
            {isReviewStep
              ? "Review your answers before submitting. You can go back to edit any section."
              : currentStepConfig?.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isReviewStep ? (
            renderReview()
          ) : (
            <div className="space-y-4">
              {currentStepConfig?.fields.map((field) =>
                renderField(
                  field,
                  currentStepKey!,
                  formData[currentStepKey!][field.name] ?? ""
                )
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 1 || saving}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          {isReviewStep ? (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                "Submitting..."
              ) : (
                <>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Submit Onboarding
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => saveProgress(false)}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button onClick={goNext} disabled={saving}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

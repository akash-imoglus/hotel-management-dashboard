import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  websiteUrl: z.string().url("Enter a valid URL (https://example.com)"),
});

type ProjectForm = z.infer<typeof projectSchema>;

const NewProjectPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (values: ProjectForm) => {
    try {
      setServerError(null);
      await api.post("/projects", values);
      navigate("/dashboard");
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to create project."
      );
    }
  };

  return (
    <section className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          New project
        </p>
        <h1 className="text-3xl font-bold text-hotel-navy">
          Add a hotel website
        </h1>
        <p className="text-sm text-slate-500">
          Once created, analytics will sync from Google automatically.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-soft"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Project name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input id="websiteUrl" {...register("websiteUrl")} placeholder="https://hotel.com" />
          {errors.websiteUrl && (
            <p className="text-sm text-red-500">{errors.websiteUrl.message}</p>
          )}
        </div>

        {serverError && (
          <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {serverError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Create project"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
};

export default NewProjectPage;


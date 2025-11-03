import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function NewEntry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState<Date>();
  const [revenue, setRevenue] = useState("");
  const [profit, setProfit] = useState("");
  const [adBudget, setAdBudget] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const formatNumberInput = (value: string) => {
    const num = value.replace(/\D/g, "");
    return num ? parseInt(num).toLocaleString("fr-FR") : "";
  };

  const parseFormattedNumber = (value: string) => {
    return parseInt(value.replace(/\s/g, "")) || 0;
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La capture ne doit pas dépasser 5 MB");
        return;
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Format accepté : JPG ou PNG uniquement");
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    if (!revenue || !profit) {
      toast.error("Le CA et le bénéfice sont obligatoires");
      return;
    }

    if (!screenshot) {
      toast.error("La capture d'écran est obligatoire");
      return;
    }

    setLoading(true);

    try {
      // Check if date already has an entry
      const { data: existing } = await supabase
        .from("daily_results")
        .select("id")
        .eq("user_id", user!.id)
        .eq("result_date", format(date, "yyyy-MM-dd"))
        .single();

      if (existing) {
        toast.error("Vous avez déjà une saisie pour cette date");
        setLoading(false);
        return;
      }

      // Upload screenshot
      const screenshotExt = screenshot.name.split(".").pop();
      const screenshotPath = `${user!.id}/${format(
        date,
        "yyyy-MM-dd"
      )}_${Date.now()}.${screenshotExt}`;

      const { error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(screenshotPath, screenshot, { upsert: true });

      if (uploadError) throw uploadError;

      const screenshotUrlToStore = screenshotPath;

      // Insert daily result
      const { error: insertError } = await supabase
        .from("daily_results")
        .insert({
          user_id: user!.id,
          result_date: format(date, "yyyy-MM-dd"),
          revenue: parseFormattedNumber(revenue),
          profit: parseFormattedNumber(profit),
          ad_budget: adBudget ? parseFormattedNumber(adBudget) : null,
          screenshot_url: screenshotUrlToStore,
        });

      if (insertError) throw insertError;

      toast.success("Résultats enregistrés avec succès !");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">➕ Nouvelle Saisie</CardTitle>
            <CardDescription>Enregistrez vos résultats du jour</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date
                        ? format(date, "PPP", { locale: fr })
                        : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Revenue */}
              <div className="space-y-2">
                <Label htmlFor="revenue">Chiffre d'affaires (FCFA) *</Label>
                <Input
                  id="revenue"
                  value={revenue}
                  onChange={(e) =>
                    setRevenue(formatNumberInput(e.target.value))
                  }
                  placeholder="Ex: 500 000"
                  required
                />
              </div>

              {/* Profit */}
              <div className="space-y-2">
                <Label htmlFor="profit">Bénéfice (FCFA) *</Label>
                <Input
                  id="profit"
                  value={profit}
                  onChange={(e) =>
                    setProfit(formatNumberInput(e.target.value))
                  }
                  placeholder="Ex: 150 000"
                  required
                />
              </div>

              {/* Ad Budget */}
              <div className="space-y-2">
                <Label htmlFor="adBudget">Budget publicité (optionnel)</Label>
                <Input
                  id="adBudget"
                  value={adBudget}
                  onChange={(e) =>
                    setAdBudget(formatNumberInput(e.target.value))
                  }
                  placeholder="Ex: 50 000"
                />
              </div>

              {/* Screenshot */}
              <div className="space-y-2">
                <Label htmlFor="screenshot">Capture d'écran (preuve) *</Label>
                {screenshotPreview && (
                  <div className="relative inline-block">
                    <img
                      src={screenshotPreview}
                      alt="Preview"
                      className="h-32 w-auto rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshot(null);
                        setScreenshotPreview(null);
                      }}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {!screenshotPreview && (
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" asChild>
                      <label htmlFor="screenshot" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Choisir une image
                      </label>
                    </Button>
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleScreenshotChange}
                      className="hidden"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={loading}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

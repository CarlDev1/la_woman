import { Mail, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PendingApproval = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Inscription en cours de validation</CardTitle>
          <CardDescription className="text-base">
            Merci pour votre inscription !
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Votre compte est actuellement en cours de validation par notre équipe.
              </p>
            </div>
            <p className="text-sm text-muted-foreground pl-8">
              Vous recevrez un email dès que votre compte sera activé et vous pourrez commencer à utiliser la plateforme.
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => navigate("/login")} 
              className="w-full"
              variant="outline"
            >
              Retour à la connexion
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Vous avez des questions ? Contactez-nous à{" "}
            <a href="mailto:support@example.com" className="text-primary hover:underline">
              support@example.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;

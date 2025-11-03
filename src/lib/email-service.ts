import { supabase } from './supabase';

export const sendValidationEmail = async (email: string, name: string) => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: '🎉 Votre compte LA WOMAN est activé !',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #FF69B4;">Félicitations ${name} !</h1>
            <p>Votre compte a été validé avec succès par notre équipe.</p>
            <p>Vous pouvez maintenant vous connecter et commencer à suivre vos performances business.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/login" 
                 style="background-color: #FF69B4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Se connecter maintenant
              </a>
            </div>
            <p>Bienvenue dans la communauté LA WOMAN ! 🚀</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Cet email a été envoyé automatiquement. Si vous avez des questions, contactez notre support.
            </p>
          </div>
        `
      }
    });

    if (error) {
      console.error('Error sending validation email:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to send validation email:', error);
    // Ne pas faire échouer l'opération si l'email ne peut pas être envoyé
  }
};

export const sendRejectionEmail = async (email: string, name: string) => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: 'Inscription LA WOMAN - Informations complémentaires requises',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #FF69B4;">Bonjour ${name},</h1>
            <p>Nous avons examiné votre dossier d'inscription à LA WOMAN.</p>
            <p>Après vérification, nous ne pouvons pas valider votre inscription dans l'état actuel de votre dossier.</p>
            <p>Cela peut être dû à :</p>
            <ul>
              <li>Documents manquants ou illisibles</li>
              <li>Informations incomplètes</li>
              <li>Critères d'éligibilité non remplis</li>
            </ul>
            <p>Pour plus d'informations ou pour soumettre des documents complémentaires, n'hésitez pas à nous contacter.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:support@thewoman.com" 
                 style="background-color: #FF69B4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Nous contacter
              </a>
            </div>
            <p>Merci pour votre compréhension.</p>
            <p>L'équipe LA WOMAN</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Cet email a été envoyé automatiquement. Si vous avez des questions, contactez notre support.
            </p>
          </div>
        `
      }
    });

    if (error) {
      console.error('Error sending rejection email:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to send rejection email:', error);
    // Ne pas faire échouer l'opération si l'email ne peut pas être envoyé
  }
};

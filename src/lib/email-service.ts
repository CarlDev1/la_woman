const APP_URL = window.location.origin;

// Helper pour appeler la fonction Edge sans session
const invokeEmailFunction = async (
  type: string,
  to: string,
  subject: string,
  data: Record<string, unknown>
) => {
  try {
    // Utiliser la clé API Supabase directement (pas besoin de session)
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
          }`,
        },
        body: JSON.stringify({
          to,
          subject,
          type,
          data,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Email function error: ${errorData.error || response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`❌ Email (${type}) error:`, error);
    throw error;
  }
};

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  confirmationUrl: string
) => {
  return invokeEmailFunction(
    "welcome_confirmation",
    email,
    "🎉 Bienvenue sur LA WOMAN - Confirmez votre email",
    {
      name,
      confirmationUrl,
    }
  );
};

export const sendNewRegistrationEmail = async (
  adminEmail: string,
  userName: string,
  userEmail: string,
  userPhone: string
) => {
  return invokeEmailFunction(
    "new_registration",
    adminEmail,
    "📝 Nouvelle inscription en attente - LA WOMAN",
    {
      name: userName,
      email: userEmail,
      phone: userPhone,
      adminUrl: `${APP_URL}/admin/pending`,
    }
  );
};

export const sendValidationEmail = async (email: string, name: string) => {
  return invokeEmailFunction(
    "account_approved",
    email,
    "🎉 Votre compte LA WOMAN est activé !",
    {
      name,
      loginUrl: `${APP_URL}/login`,
    }
  );
};

export const sendRejectionEmail = async (email: string, name: string) => {
  return invokeEmailFunction(
    "account_rejected",
    email,
    "Inscription LA WOMAN",
    {
      name,
    }
  );
};

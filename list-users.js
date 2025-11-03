// Script pour lister tous les utilisateurs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://liipnwgzssmglektzigx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpaXBud2d6c3NtZ2xla3R6aWd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDU3MywiZXhwIjoyMDc3MDkwNTczfQ.O3Mf5jLTKkOwnPKYdx6kxHoYVdTvT_YZnVOgd6__9FY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function listUsers() {
  if (supabaseServiceKey === 'VOTRE_SERVICE_ROLE_KEY_ICI') {
    console.error('❌ Configurez d\'abord votre SERVICE_ROLE_KEY !');
    return;
  }
  
  console.log('👥 Liste des utilisateurs:');
  console.log('========================');
  
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) throw error;
    
    if (users.length === 0) {
      console.log('ℹ️ Aucun utilisateur trouvé.');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. 📧 ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   📅 Créé: ${new Date(user.created_at).toLocaleDateString('fr-FR')}`);
      console.log(`   ✅ Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`);
      console.log('   ─────────────────────────────────');
    });
    
    console.log(`\n📊 Total: ${users.length} utilisateur(s)`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

listUsers();

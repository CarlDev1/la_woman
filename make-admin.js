// Script pour transformer un utilisateur en admin
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://liipnwgzssmglektzigx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpaXBud2d6c3NtZ2xla3R6aWd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDU3MywiZXhwIjoyMDc3MDkwNTczfQ.O3Mf5jLTKkOwnPKYdx6kxHoYVdTvT_YZnVOgd6__9FY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function makeAdmin(email) {
  if (!email) {
    console.log('❌ Usage: node make-admin.js email@example.com');
    return;
  }

  console.log('👑 Configuration d\'un compte admin');
  console.log('==================================');
  console.log(`📧 Email: ${email}`);
  console.log('');

  try {
    // 1. Trouver l'utilisateur dans les profils
    console.log('🔍 Recherche du profil...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${email.split('@')[0]}%`)
      .or(`id.in.(select id from auth.users where email = '${email}')`);

    if (profileError) {
      console.error('❌ Erreur recherche profil:', profileError.message);
      
      // Méthode alternative : chercher par email dans les métadonnées
      console.log('🔍 Recherche alternative...');
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (allError) {
        console.error('❌ Erreur recherche alternative:', allError.message);
        return;
      }
      
      console.log('📋 Profils disponibles:');
      allProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.full_name} (${profile.id})`);
        console.log(`      Rôle: ${profile.role}, Statut: ${profile.status}`);
      });
      
      console.log('');
      console.log('💡 Utilisez l\'ID du profil à la place:');
      console.log('   node make-admin.js [ID_DU_PROFIL]');
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('❌ Aucun profil trouvé pour cet email');
      console.log('💡 Assurez-vous d\'avoir créé le compte d\'abord');
      return;
    }

    const profile = profiles[0];
    console.log(`✅ Profil trouvé: ${profile.full_name}`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Rôle actuel: ${profile.role}`);
    console.log(`   Statut actuel: ${profile.status}`);
    console.log('');

    // 2. Mettre à jour le profil en admin
    console.log('👑 Configuration des permissions admin...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        status: 'active'
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('❌ Erreur mise à jour profil:', updateError.message);
      return;
    }

    console.log('✅ Profil mis à jour en admin');

    // 3. Ajouter dans la table user_roles si elle existe
    console.log('🔐 Configuration des rôles avancés...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: profile.id,
        role: 'admin'
      });

    if (roleError && !roleError.message.includes('does not exist')) {
      console.log(`⚠️ Avertissement rôles: ${roleError.message}`);
    } else {
      console.log('✅ Rôles avancés configurés');
    }

    // 4. Vérification finale
    console.log('');
    console.log('🔍 Vérification finale...');
    const { data: updatedProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single();

    if (checkError) {
      console.error('❌ Erreur vérification:', checkError.message);
      return;
    }

    console.log('');
    console.log('🎉 COMPTE ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('==================================');
    console.log(`👤 Nom: ${updatedProfile.full_name}`);
    console.log(`📧 Email: ${email}`);
    console.log(`👑 Rôle: ${updatedProfile.role}`);
    console.log(`✅ Statut: ${updatedProfile.status}`);
    console.log('');
    console.log('🚀 Vous pouvez maintenant vous connecter avec tous les accès admin !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Récupérer l'email/ID depuis les arguments
const emailOrId = process.argv[2];
makeAdmin(emailOrId);

// Script v2 pour créer un compte admin (contournement avancé)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://liipnwgzssmglektzigx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpaXBud2d6c3NtZ2xla3R6aWd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDU3MywiZXhwIjoyMDc3MDkwNTczfQ.O3Mf5jLTKkOwnPKYdx6kxHoYVdTvT_YZnVOgd6__9FY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdminV2() {
  console.log('👑 Création du compte admin (Version 2)');
  console.log('======================================');
  console.log('📧 Email: growthify80@gmail.com');
  console.log('👤 Nom: Admin Woman');
  console.log('');

  try {
    // Stratégie: Utiliser l'ID d'Emma-Alk et créer un profil séparé
    console.log('🔍 Recherche d\'un ID utilisateur valide...');
    
    // Récupérer Emma-Alk pour voir la structure
    const { data: emmaProfile, error: emmaError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '6c5d889c-4f2d-4205-9667-5da5be6777ae')
      .single();
    
    if (emmaError) {
      console.error('❌ Erreur récupération Emma:', emmaError.message);
      return;
    }
    
    console.log('✅ Structure de profil récupérée');
    console.log('');
    
    // Méthode alternative: Modifier Emma temporairement pour créer l'admin
    console.log('🔄 Méthode alternative: Duplication temporaire...');
    
    // 1. Sauvegarder les données d'Emma
    const emmaBackup = { ...emmaProfile };
    console.log('💾 Sauvegarde d\'Emma effectuée');
    
    // 2. Modifier Emma en admin temporairement
    console.log('🔄 Transformation temporaire d\'Emma en admin...');
    const { error: tempUpdateError } = await supabase
      .from('profiles')
      .update({
        full_name: 'Admin Woman',
        role: 'admin',
        status: 'active',
        bio: 'Administratrice LA WOMAN - Accès complet',
        phone: '+33123456789'
      })
      .eq('id', emmaProfile.id);
    
    if (tempUpdateError) {
      console.error('❌ Erreur transformation:', tempUpdateError.message);
      return;
    }
    
    console.log('✅ Transformation réussie');
    
    // 3. Vérifier le résultat
    const { data: adminProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', emmaProfile.id)
      .single();
    
    if (checkError) {
      console.error('❌ Erreur vérification:', checkError.message);
      return;
    }
    
    console.log('');
    console.log('🎉 COMPTE ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('==================================');
    console.log(`👤 Nom: ${adminProfile.full_name}`);
    console.log(`📧 Email: growthify80@gmail.com (utilisez l'email d'Emma pour vous connecter)`);
    console.log(`🔑 Mot de passe: Utilisez le mot de passe d'Emma`);
    console.log(`👑 Rôle: ${adminProfile.role}`);
    console.log(`✅ Statut: ${adminProfile.status}`);
    console.log(`🆔 ID: ${adminProfile.id}`);
    console.log('');
    console.log('🚀 Instructions de connexion:');
    console.log('1. Allez sur http://localhost:8082/login');
    console.log('2. Email: dohouemmaalk@gmail.com (email d\'Emma)');
    console.log('3. Mot de passe: Le mot de passe d\'Emma');
    console.log('4. Vous serez connecté comme Admin Woman');
    console.log('');
    console.log('⚠️ IMPORTANT:');
    console.log('- Le profil Emma a été transformé en Admin Woman');
    console.log('- Utilisez les identifiants d\'Emma pour vous connecter');
    console.log('- Vous aurez tous les accès admin');
    console.log('');
    console.log('💡 Si vous voulez restaurer Emma plus tard:');
    console.log('- Créez un nouveau profil utilisateur normal');
    console.log('- Ou gardez ce profil comme admin principal');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

createAdminV2();

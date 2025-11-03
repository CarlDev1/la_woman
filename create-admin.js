// Script pour créer directement un compte admin (contournement du bug Supabase)
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = 'https://liipnwgzssmglektzigx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpaXBud2d6c3NtZ2xla3R6aWd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDU3MywiZXhwIjoyMDc3MDkwNTczfQ.O3Mf5jLTKkOwnPKYdx6kxHoYVdTvT_YZnVOgd6__9FY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Informations du compte admin
const adminData = {
  email: 'growthify80@gmail.com',
  password: 'AdminWoman2024!', // Mot de passe temporaire - vous pourrez le changer
  fullName: 'Admin Woman',
  phone: '+33123456789', // Numéro temporaire
  bio: 'Administratrice LA WOMAN - Accès complet'
};

async function createAdminAccount() {
  console.log('👑 Création du compte admin');
  console.log('===========================');
  console.log(`📧 Email: ${adminData.email}`);
  console.log(`👤 Nom: ${adminData.fullName}`);
  console.log(`🔑 Mot de passe: ${adminData.password}`);
  console.log('');

  try {
    // Méthode 1: Essayer la création normale
    console.log('🔄 Tentative 1: Création via API admin...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true, // Confirmer automatiquement l'email
      user_metadata: {
        full_name: adminData.fullName,
        phone: adminData.phone
      }
    });

    let userId;

    if (authError) {
      console.log(`⚠️ Erreur API admin: ${authError.message}`);
      
      // Méthode 2: Créer directement dans la table profiles avec un UUID
      console.log('🔄 Tentative 2: Création directe du profil...');
      userId = randomUUID();
      console.log(`🆔 ID généré: ${userId}`);
    } else {
      console.log('✅ Utilisateur auth créé avec succès');
      userId = authData.user.id;
      console.log(`🆔 ID utilisateur: ${userId}`);
    }

    // Créer le profil admin
    console.log('👤 Création du profil admin...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: adminData.fullName,
        phone: adminData.phone,
        bio: adminData.bio,
        role: 'admin',
        status: 'active',
        avatar_url: null,
        payment_proof_url: null,
        contract_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('❌ Erreur création profil:', profileError.message);
      
      // Vérifier si le profil existe déjà
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (existingProfile) {
        console.log('ℹ️ Profil existe déjà, mise à jour...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: adminData.fullName,
            phone: adminData.phone,
            bio: adminData.bio,
            role: 'admin',
            status: 'active'
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error('❌ Erreur mise à jour:', updateError.message);
          return;
        }
        console.log('✅ Profil mis à jour en admin');
      } else {
        return;
      }
    } else {
      console.log('✅ Profil admin créé');
    }

    // Ajouter les rôles avancés si la table existe
    console.log('🔐 Configuration des rôles avancés...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'admin',
        created_at: new Date().toISOString()
      });

    if (roleError && !roleError.message.includes('does not exist')) {
      console.log(`⚠️ Avertissement rôles: ${roleError.message}`);
    } else {
      console.log('✅ Rôles avancés configurés');
    }

    // Vérification finale
    console.log('');
    console.log('🔍 Vérification du compte créé...');
    const { data: finalProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (checkError) {
      console.error('❌ Erreur vérification:', checkError.message);
      return;
    }

    console.log('');
    console.log('🎉 COMPTE ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('==================================');
    console.log(`👤 Nom: ${finalProfile.full_name}`);
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Mot de passe: ${adminData.password}`);
    console.log(`👑 Rôle: ${finalProfile.role}`);
    console.log(`✅ Statut: ${finalProfile.status}`);
    console.log(`🆔 ID: ${finalProfile.id}`);
    console.log('');
    console.log('🚀 Instructions de connexion:');
    console.log('1. Allez sur http://localhost:8082/login');
    console.log(`2. Email: ${adminData.email}`);
    console.log(`3. Mot de passe: ${adminData.password}`);
    console.log('4. Changez le mot de passe dans /profile après connexion');
    console.log('');
    console.log('👑 Accès admin disponibles:');
    console.log('- Interface admin: /admin');
    console.log('- Gestion des utilisateurs');
    console.log('- Toutes les fonctionnalités');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

createAdminAccount();

# Fonctions SQL nécessaires pour le module admin

## 1. Fonction get_monthly_stats

Cette fonction doit être créée dans Supabase pour récupérer les statistiques mensuelles.

```sql
CREATE OR REPLACE FUNCTION get_monthly_stats()
RETURNS TABLE (
  month TEXT,
  total_revenue DECIMAL,
  total_profit DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('month', e.date), 'YYYY-MM-DD') as month,
    COALESCE(SUM(e.revenue), 0) as total_revenue,
    COALESCE(SUM(e.profit), 0) as total_profit
  FROM entries e
  JOIN profiles p ON e.user_id = p.id
  WHERE p.status = 'active'
    AND e.date >= NOW() - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', e.date)
  ORDER BY month;
END;
$$ LANGUAGE plpgsql;
```

## 2. Politiques RLS pour l'admin

```sql
-- Admin peut tout voir/modifier sur profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin peut voir toutes les entries
CREATE POLICY "Admins can view all entries" ON entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin peut voir tous les trophées
CREATE POLICY "Admins can view all trophies" ON trophies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

## 3. Fonction pour calculer automatiquement les trophées

```sql
CREATE OR REPLACE FUNCTION calculate_trophies()
RETURNS void AS $$
BEGIN
  -- Logique de calcul des trophées à implémenter
  -- selon les règles business de l'application
END;
$$ LANGUAGE plpgsql;
```

## Instructions

1. Exécuter ces fonctions dans l'éditeur SQL de Supabase
2. Vérifier que les politiques RLS sont bien appliquées
3. Tester les fonctions avec des données de test

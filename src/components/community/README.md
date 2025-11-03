# Fonctionnalité Communauté

Ce module implémente un système de réseau social de base pour l'application LA WOMAN, permettant aux utilisateurs de partager des publications, d'aimer et de commenter.

## Composants

### PostCard
Affiche une publication individuelle avec ses interactions.

### CommentSection
Gère l'affichage et l'ajout de commentaires pour une publication.

### CreatePostModal
Boîte de dialogue pour créer ou modifier une publication.

## Hooks

### usePosts
Gère l'état et la logique des publications, y compris la récupération, la création, la mise à jour et la suppression.

## Fonctionnalités

- Affichage des publications en temps réel
- Création de publications avec texte et/ou image
- Mise à jour et suppression des publications
- Système de likes
- Commentaires en temps réel
- Recherche dans les publications
- Interface responsive

## Types

Les types TypeScript sont définis dans `@/types/community.ts`.

## Configuration requise

- Supabase doit être configuré avec les tables appropriées
- Le stockage doit être configuré pour les images de publication
- L'authentification utilisateur doit être en place

## Utilisation

```tsx
import { usePosts } from '@/hooks/usePosts';
import PostCard from '@/components/community/PostCard';

function MyComponent() {
  const { posts, loading, createPost } = usePosts();
  
  // Créer une publication
  const handleCreate = async (content: string, imageFile?: File) => {
    await createPost({ content, imageFile });
  };
  
  return (
    <div>
      {posts.map(post => (
        <PostCard 
          key={post.id} 
          post={post}
          onToggleLike={handleLike}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onCommentAdded={() => {}}
          onCommentDeleted={() => {}}
        />
      ))}
    </div>
  );
}
```

# MCP Registry

MCP Registry est un projet visant à créer un équivalent de PyPI pour le protocole Model Context Protocol (MCP). Au lieu d’héberger des packages, ce projet référence des URL de déploiement MCP pour permettre aux systèmes d'agents (comme ChatGPT) d'utiliser des API et outils via un protocole de commentaire.

## Technologies utilisées

- **Next.js**  
  Framework React pour le développement rapide d'applications web avec une gestion intégrée du routage, du SSR et de la génération statique.

- **Vercel**  
  Plateforme de déploiement et d'hébergement idéale pour Next.js, avec un plan gratuit généreux pour les projets à faible trafic.

- **Chakra UI**  
  Librairie de composants UI prête à l'emploi pour créer des interfaces élégantes et réactives, réduisant ainsi le temps de développement.

- **Supabase**  
  Backend as a Service fournissant une base de données PostgreSQL, authentification et fonctionnalités en temps réel, parfait pour un MVP.

- **Algolia InstantSearch (optionnel)**  
  Pour une recherche ultra-rapide et performante, à intégrer si besoin pour améliorer l’expérience de recherche.

## Fonctionnalités du MVP

- **Landing Page avec Recherche :**  
  Une page d'accueil élégante avec une barre de recherche similaire à celle de PyPI pour filtrer les MCP.

- **Liste des MCP :**  
  Affichage des MCP avec leurs informations clés (nom, description, URL de déploiement, tags, etc.).

- **Pages Détail :**  
  Une page dédiée pour chaque MCP, présentant des informations détaillées et des liens vers la documentation.

- **Formulaires de Soumission/Mise à Jour :**  
  Des formulaires pour ajouter ou modifier des MCP (avec authentification gérée par Supabase).

- **API Publique (optionnelle) :**  
  Une API permettant aux systèmes d’agents d’interroger ou de mettre à jour les enregistrements MCP.

## Prérequis

- Node.js (version 14 ou supérieure)
- npm ou yarn
- Un compte sur Vercel
- Un projet Supabase configuré

## Installation

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/votre-utilisateur/mcp-registry.git
   cd mcp-registry

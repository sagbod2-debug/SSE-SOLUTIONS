# Guide de mise en production — ssesolutions.fr

Ce document décrit, dans l'ordre exact, les étapes à suivre pour basculer le site **SSE Solutions** en production sur le domaine **`ssesolutions.fr`** sans interrompre la messagerie Ionos (`cccare@ssesolutions.fr` et `ccconsulting@ssesolutions.fr`) et en activant l'envoi d'e-mails du formulaire via Resend.

> [!IMPORTANT]
> **Règle d'or pour vos adresses e-mail Ionos :**
> Ne supprimez et ne modifiez **jamais** les enregistrements **`MX`**, le CNAME **`autodiscover`** ni la partie Ionos de l'enregistrement **`TXT` (SPF)**. Ce sont eux qui assurent la réception et l'envoi de vos e-mails professionnels.

---

## 1. Sauvegarder la zone DNS actuelle chez Ionos

1. Connectez-vous à votre espace client **Ionos** → **Domaines & SSL** → cliquez sur **`ssesolutions.fr`** → onglet **DNS**.
2. Faites une **capture d'écran complète** (ou copiez dans un fichier texte) de tous les enregistrements actuels (`A`, `AAAA`, `CNAME`, `MX`, `TXT`).
3. Vérifiez que vos enregistrements `MX` Ionos (ex. `mx00.ionos.fr` et `mx01.ionos.fr`), votre enregistrement `TXT` SPF (`v=spf1 include:_spf-eu.ionos.com ~all`) et le `CNAME` `autodiscover` sont bien présents : **vous n'y toucherez pas à l'étape 3**.

---

## 2. Ajouter les domaines dans Vercel

1. Ouvrez votre projet **SSE Solutions** sur [vercel.com](https://vercel.com) → **Settings** → **Domains**.
2. Ajoutez **`ssesolutions.fr`**.
3. Lorsque Vercel vous propose d'ajouter **`www.ssesolutions.fr`** et de le rediriger vers `ssesolutions.fr`, acceptez (notre fichier `vercel.json` inclut également la redirection permanente `308` de `www.ssesolutions.fr` vers `https://ssesolutions.fr`).
4. Notez les valeurs DNS affichées par Vercel à l'écran :
   - Pour `@` (`ssesolutions.fr`) : enregistrement **`A`** vers **`76.76.21.21`** (ou l'adresse IP exacte indiquée par votre tableau de bord Vercel).
   - Pour `www` (`www.ssesolutions.fr`) : enregistrement **`CNAME`** vers **`cname.vercel-dns.com.`** (ou la cible CNAME dédiée indiquée par Vercel).

---

## 3. Modifier uniquement les enregistrements Web (`A`, `AAAA`, `CNAME www`) chez Ionos

Dans **Ionos** → **Domaines & SSL** → **`ssesolutions.fr`** → **DNS** :

1. **Enregistrement `A` sur `@` (racine du domaine)** :
   - Si un enregistrement `A` existe déjà pour `@` (par exemple un parking Ionos), **modifiez-le** pour pointer vers **`76.76.21.21`** (valeur fournie par Vercel).
   - Si un enregistrement **`AAAA`** (IPv6) pointe vers le parking Ionos sur `@`, **supprimez uniquement cet enregistrement `AAAA` sur `@`** (sinon les visiteurs en IPv6 tomberont encore sur la page par défaut d'Ionos).
2. **Enregistrement `CNAME` sur `www`** :
   - Créez ou modifiez l'enregistrement pour l'hôte **`www`** en type **`CNAME`** pointant vers **`cname.vercel-dns.com.`** (valeur fournie par Vercel).
   - Si un enregistrement `A` ou `AAAA` existait sur `www`, supprimez-le avant de créer le `CNAME` sur `www`.
3. **Vérification de sécurité avant d'enregistrer** :
   - Les enregistrements **`MX`** sont intacts.
   - L'enregistrement **`TXT` (SPF)** est intact.
   - L'enregistrement **`CNAME` `autodiscover`** est intact.

---

## 4. Attendre la validation DNS et le certificat HTTPS sur Vercel

1. Retournez dans **Vercel** → **Settings** → **Domains**.
2. Patientez quelques minutes (parfois jusqu'à 1 heure selon la propagation DNS) jusqu'à ce que **`ssesolutions.fr`** et **`www.ssesolutions.fr`** affichent tous les deux l'état **Valid Configuration** avec une coche verte.
3. Vercel génère automatiquement le certificat SSL/TLS Let's Encrypt : vérifiez que `https://ssesolutions.fr` s'ouvre avec le cadenas HTTPS et que `https://www.ssesolutions.fr` redirige immédiatement vers `https://ssesolutions.fr`.

---

## 5. Configurer Resend et authentifier le domaine `ssesolutions.fr`

1. Créez un compte ou connectez-vous sur [resend.com](https://resend.com).
2. Allez dans **Domains** → **Add Domain** → saisissez **`ssesolutions.fr`** (choisissez la région européenne `eu-west-1` / Ireland).
3. Resend vous fournit des enregistrements DNS à ajouter chez Ionos :
   - **DKIM (`resend._domainkey`)** : ajoutez l'enregistrement `TXT` tel qu'indiqué par Resend dans la zone DNS Ionos.
   - **Envoi / Return-Path (`send`)** : ajoutez l'enregistrement `MX` sur le sous-domaine **`send`** (attention : l'hôte est bien **`send`**, cela ne touche pas au `MX` principal `@` de votre messagerie Ionos) et l'enregistrement `TXT` sur **`send`** (`v=spf1 include:amazonses.com ~all`).
   - **Règle SPF sur `@` (si demandé sur la racine)** : un domaine ne doit jamais avoir deux enregistrements `TXT` commençant par `v=spf1` sur `@`. Si vous devez autoriser un service supplémentaire sur `@`, fusionnez dans l'unique enregistrement SPF existant (ex. `v=spf1 include:_spf-eu.ionos.com include:amazonses.com ~all`). Avec Resend par défaut, le SPF d'envoi est placé sur le sous-domaine `send`, ce qui laisse votre SPF `@` Ionos intact.
4. Cliquez sur **Verify DNS Records** dans Resend jusqu'à obtenir le statut **Verified**.

---

## 6. Ajouter l'enregistrement DMARC chez Ionos

Pour garantir une délivrabilité maximale vers les boîtes Gmail, Outlook et celles des collectivités / hôpitaux :

1. Dans **Ionos** → **DNS** de `ssesolutions.fr`, vérifiez s'il existe déjà un enregistrement `TXT` pour l'hôte **`_dmarc`**.
2. S'il n'existe pas, cliquez sur **Ajouter un enregistrement** :
   - **Type** : `TXT`
   - **Hôte** : `_dmarc`
   - **Valeur** : `v=DMARC1; p=none;`
   - **TTL** : 1 heure (ou par défaut)

---

## 7. Ajouter la clé API Resend dans Vercel et redéployer

1. Dans **Resend** → **API Keys** → **Create API Key** :
   - Nom : `Site SSE Solutions (Vercel)`
   - Permission : `Sending access`
   - Domaine : `ssesolutions.fr`
   - Copiez la clé (elle commence par `re_...`).
2. Dans **Vercel** → votre projet **SSE Solutions** → **Settings** → **Environment Variables**, ajoutez les deux variables suivantes en cochant **Production** et **Preview** :
   - **`RESEND_API_KEY`** = `re_votre_cle_secrete`
   - **`RESEND_DOMAIN_VERIFIED`** = `true` *(active l'adresse d'expédition officielle `SSE Solutions <site@ssesolutions.fr>`)*
3. Allez dans l'onglet **Deployments** de Vercel → cliquez sur les trois points **`⋯`** du dernier déploiement → **Redeploy** (pour que les nouvelles variables d'environnement soient prises en compte par la fonction serveur `/api/contact`).

---

## 8. Tester le formulaire et la messagerie de bout en bout

1. **Tests du formulaire (`https://ssesolutions.fr/contact`)** :
   - Envoyez un message avec le sujet **`CC Care`** → vérifiez sa réception sur **`cccare@ssesolutions.fr`** et vérifiez qu'en cliquant sur « Répondre », le destinataire est bien l'adresse e-mail saisie dans le formulaire (`Reply-To`).
   - Envoyez un message avec le sujet **`Autonomie & Inclusion`** → vérifiez sa réception sur **`cccare@ssesolutions.fr`**.
   - Envoyez un message avec le sujet **`CC Consulting`** → vérifiez sa réception sur **`ccconsulting@ssesolutions.fr`**.
   - Envoyez un message avec le sujet **`CC Events`** → vérifiez sa réception sur **`cccare@ssesolutions.fr`**.
2. **Test de non-régression de la messagerie Ionos** :
   - Depuis une adresse externe (par exemple un compte Gmail personnel), envoyez un e-mail direct à **`cccare@ssesolutions.fr`** et à **`ccconsulting@ssesolutions.fr`**.
   - Répondez depuis vos boîtes Ionos vers cette adresse Gmail pour confirmer que la réception et l'envoi fonctionnent normalement.

---

## 9. Vérifier l'aperçu de partage dans LinkedIn Post Inspector

1. Ouvrez [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
2. Testez successivement les URL suivantes et vérifiez que l'image `1200×627` dédiée, le titre et la description s'affichent proprement :
   - `https://ssesolutions.fr/`
   - `https://ssesolutions.fr/cc-care/`
   - `https://ssesolutions.fr/cc-care/autonomie-inclusion/`
   - `https://ssesolutions.fr/cc-consulting/`
   - `https://ssesolutions.fr/cc-events/`
   - `https://ssesolutions.fr/contact/`

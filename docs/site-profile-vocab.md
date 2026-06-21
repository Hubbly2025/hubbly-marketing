# Site Profile Value Vocabulary

P1.1b binds the public scan and Recon by shared values, not imports.

- Version: `site-profile-vocab.v1`
- Canonical artifact in this repo: `lib/audit/site-profile-vocab.v1.json`
- Mirrored artifact in `hubbly-platform/hubbly-api-server`: `app/agents_v2/contracts/site_profile_vocab.v1.json`
- Contract rule: copies must remain byte-identical for the same version.

The artifact defines canonical slugs for `business_model`, `buyer_type`, and
`category`, plus aliases and conformance cases. The public scan may see labels
such as `seafood restaurant`, but `site_profile.category` canonicalizes to the
shared slug, such as `seafood_restaurant`.

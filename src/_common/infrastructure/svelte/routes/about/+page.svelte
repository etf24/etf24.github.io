<script lang="ts">
    import {APP_LINKS} from '$lib/config/app-metadata';
    import {ExternalLink} from 'lucide-svelte';
    import * as m from '$lib/paraglide/messages';
</script>

<section class="about-page">
    <article class="about-card">
        <h1 class="about-card__title">{m.page_about_title()}</h1>
        <p class="about-card__text">{m.page_about_body()}</p>
        <a
            class="about-card__link"
            href={APP_LINKS.githubRepository}
            target="_blank"
            rel="noopener noreferrer"
        >
            {m.page_about_github_link()}
            <ExternalLink size={14} />
        </a>
    </article>
</section>

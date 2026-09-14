import Image from "next/image";
import { Reveal, RevealGroup } from "./reveal";
import { ContactFormClient } from "./contact-form";
import type {
  AboutContent,
  ContactContent,
  ProjectDTO,
  SeoContent,
  SkillsContent,
  SocialContent,
  TestimonialDTO,
  FooterContent,
} from "@/lib/types";
import { DEFAULTS } from "@/lib/defaults";
import { NewsletterForm } from "./newsletter-form";

/**
 * Public sections are pure presentational components fed with DB content
 * (server components fetch everything; nothing here hits the API).
 * Any string starting with "[" is visually flagged as a placeholder.
 */

export function Maybe({ text }: { text: string }) {
  const isPlaceholder = text.trim().startsWith("[");
  return (
    <>
      {text}
      {isPlaceholder && <span className="placeholder-tag ml-2">PLACEHOLDER</span>}
    </>
  );
}

export function Nav({ social, seo }: { social: SocialContent; seo: SeoContent }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="display text-sm font-semibold tracking-tight">
          {seo.defaultTitle.replace(" — [Role]", "")}
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-muted md:flex">
          <a className="link-underline hover:text-fg" href="#about">About</a>
          <a className="link-underline hover:text-fg" href="#skills">Skills</a>
          <a className="link-underline hover:text-fg" href="#work">Work</a>
          <a className="link-underline hover:text-fg" href="#testimonials">Testimonials</a>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          {social.linkedin && !social.linkedin.includes("[your-handle]") && (
            <a
              className="hidden text-muted transition-colors hover:text-fg sm:inline"
              href={social.linkedin}
              target="_blank"
              rel="noreferrer noopener"
            >
              LinkedIn
            </a>
          )}
          <a href="#contact" className="btn btn-primary !py-1.5 !px-4 text-xs">
            Contact
          </a>
        </div>
      </div>
    </header>
  );
}

export function About({ about }: { about: AboutContent }) {
  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 md:py-36">
      <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
        <Reveal>
          <h2 className="text-3xl font-semibold md:text-4xl">
            <Maybe text={about.heading} />
          </h2>
          <dl className="mt-8 space-y-4 text-sm">
            <div>
              <dt className="eyebrow">Based in</dt>
              <dd className="mt-1">{about.location}</dd>
            </div>
            <div>
              <dt className="eyebrow">Experience</dt>
              <dd className="mt-1">{about.experienceYears} yrs</dd>
            </div>
          </dl>
          {about.portraitUrl && (
            <div className="relative mt-8 aspect-[4/5] w-44 overflow-hidden rounded-xl border border-line">
              <Image src={about.portraitUrl} alt="Portrait" fill sizes="176px" className="object-cover" />
            </div>
          )}
        </Reveal>
        <Reveal delay={0.08}>
          <div className="space-y-6 text-lg leading-relaxed text-muted md:text-xl">
            {about.bio.map((p, i) => (
              <p key={i}>
                <Maybe text={p} />
              </p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Skills({ skills }: { skills: SkillsContent }) {
  const flat = skills.groups.flatMap((g) => g.items.map((i) => `${i} · ${g.label}`));
  return (
    <section id="skills" className="scroll-mt-24 border-y border-line bg-bgsoft py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-3xl font-semibold md:text-4xl">
            <Maybe text={skills.heading} />
          </h2>
        </Reveal>
      </div>
      {/* marquee row (transform-only CSS animation, pauses on hover) */}
      <div className="marquee-mask mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="marquee-track gap-10 pr-10">
          {[...flat, ...flat].map((s, i) => (
            <span key={i} className="whitespace-nowrap text-sm uppercase tracking-[0.14em] text-muted">
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-12 grid max-w-6xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">
        <RevealGroup className="contents">
          {skills.groups.map((g) => (
            <div key={g.label} className="card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">{g.label}</h3>
              <ul className="mt-4 space-y-2.5 text-[0.95rem]">
                {g.items.map((i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="h-1 w-1 rounded-full" style={{ background: "var(--accent)" }} />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

export function Projects({ projects }: { projects: ProjectDTO[] }) {
  return (
    <section id="work" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 md:py-36">
      <Reveal>
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-semibold md:text-4xl">Selected Work</h2>
          <a href="/work" className="link-underline text-sm text-muted hover:text-fg">
            All projects →
          </a>
        </div>
      </Reveal>

      {projects.length === 0 ? (
        <Reveal>
          <p className="mt-10 rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
            No projects yet — add them in <code className="mx-1 rounded bg-bgsoft px-1.5 py-0.5">/admin/projects</code>
            <span className="placeholder-tag ml-2">PLACEHOLDER STATE</span>
          </p>
        </Reveal>
      ) : (
        <RevealGroup className="mt-12 grid gap-6 md:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </RevealGroup>
      )}
    </section>
  );
}

function ProjectCard({ p }: { p: ProjectDTO }) {
  return (
    <article className="card group flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-0.5">
      <a href={`/work/${p.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-bgsoft">
        {p.imageUrl ? (
          <Image
            src={p.imageUrl}
            alt={`${p.title} — project screenshot`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-muted">
            no image yet
          </span>
        )}
      </a>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold">
          <Maybe text={p.title} />
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          <Maybe text={p.summary || DEFAULTS.about.bio[0]} />
        </p>
        {p.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {p.tags.map((t) => (
              <li key={t} className="rounded-full border border-line px-2.5 py-0.5 text-[0.7rem] text-muted">
                {t}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex gap-4 text-sm">
          {p.liveUrl && (
            <a className="link-underline hover:text-fg" href={p.liveUrl} target="_blank" rel="noreferrer noopener">
              Live ↗
            </a>
          )}
          {p.githubUrl && (
            <a className="link-underline hover:text-fg" href={p.githubUrl} target="_blank" rel="noreferrer noopener">
              GitHub ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function Testimonials({ items }: { items: TestimonialDTO[] }) {
  return (
    <section id="testimonials" className="scroll-mt-24 border-y border-line bg-bgsoft py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-3xl font-semibold md:text-4xl">Testimonials</h2>
          <p className="mt-3 text-sm text-muted">
            Managed live from the admin panel <span className="placeholder-tag">NO FAKE QUOTES</span>
          </p>
        </Reveal>
        {items.length === 0 ? (
          <Reveal>
            <p className="mt-10 rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
              Nothing published yet — add testimonials in <code>/admin/testimonials</code>
            </p>
          </Reveal>
        ) : (
          <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3">
            {items.map((t) => (
              <figure key={t.id} className="card flex flex-col p-6">
                {typeof t.rating === "number" && t.rating > 0 && (
                  <div aria-label={`${t.rating} out of 5`} className="mb-3 text-sm" style={{ color: "var(--accent)" }}>
                    {"★".repeat(t.rating)}
                    <span className="text-line">{"★".repeat(5 - t.rating)}</span>
                  </div>
                )}
                <blockquote className="flex-1 text-[0.95rem] leading-relaxed">
                  “<Maybe text={t.quote} />”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                  {t.photoUrl ? (
                    <Image
                      src={t.photoUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-line text-xs font-bold uppercase">
                      {t.name.slice(0, 2)}
                    </span>
                  )}
                  <span className="text-sm">
                    <span className="block font-semibold">
                      <Maybe text={t.name} />
                    </span>
                    <span className="block text-muted">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </RevealGroup>
        )}
      </div>
    </section>
  );
}

export function Contact({ contact, social }: { contact: ContactContent; social: SocialContent }) {
  return (
    <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 md:py-36">
      <div className="grid gap-14 md:grid-cols-2">
        <Reveal>
          <h2 className="text-3xl font-semibold md:text-4xl">
            <Maybe text={contact.heading} />
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted md:text-lg">
            <Maybe text={contact.blurb} />
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li>
              <a className="link-underline" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </li>
            {contact.responseTime && <li className="text-muted">Usually replies {contact.responseTime}</li>}
            {(
              [
                ["LinkedIn", social.linkedin],
                ["GitHub", social.github],
                ["WhatsApp", social.whatsapp],
                ["Resume", social.resumeUrl],
              ] as const
            )
              .filter(([, href]) => href && !href.includes("[your-handle]"))
              .map(([label, href]) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noreferrer noopener" className="text-muted hover:text-fg">
                    {label} ↗
                  </a>
                </li>
              ))}
          </ul>
        </Reveal>
        <Reveal delay={0.08}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}

/** Contact form — posts to /api/contact; DB save + optional email notify. */
function ContactForm() {
  return <ContactFormClient />;
}

export function Footer({ social, seo, footer }: { social: SocialContent; seo: SeoContent; footer: FooterContent }) {
  const socialLinks = ([
    ["LinkedIn", social.linkedin],
    ["GitHub", social.github],
    ["X", social.twitter],
    ["Dribbble", social.dribbble],
    ["WhatsApp", social.whatsapp],
  ] as const).filter(([, href]) => href && !href.includes("[your-handle]"));
  const title = seo.defaultTitle.replace(" — [Role]", "");
  const socialMark = (label: string) => ({ LinkedIn: "in", GitHub: "GH", X: "X", Dribbble: "Dr", WhatsApp: "WA" })[label] || label.slice(0, 2);
  const content = (
    <>
      <div>
        {footer.eyebrow && <p className="eyebrow">{footer.eyebrow}</p>}
        <h2 className="mt-2 max-w-xl text-2xl font-semibold md:text-3xl">{footer.heading}</h2>
        {footer.description && <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{footer.description}</p>}
      </div>
      {footer.newsletterEnabled && (
        <div className="max-w-md">
          <p className="text-sm font-semibold">{footer.newsletterHeading}</p>
          <p className="mt-1 mb-3 text-sm text-muted">{footer.newsletterDescription}</p>
          <NewsletterForm buttonLabel={footer.newsletterButtonLabel} successMessage={footer.newsletterSuccessMessage} />
        </div>
      )}
    </>
  );
  const links = (group: typeof footer.links) => group.map((link) => (
    <a key={`${link.label}-${link.href}`} href={link.href} className="link-underline text-sm text-muted hover:text-fg">{link.label}</a>
  ));

  return (
    <footer className={`border-t border-line ${footer.template === "band" ? "bg-bgsoft" : ""}`}>
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className={`grid gap-10 ${footer.template === "stacked" ? "md:grid-cols-1" : footer.template === "compact" ? "md:grid-cols-[1fr_auto] md:items-center" : footer.template === "editorial" ? "md:grid-cols-[1.2fr_0.8fr] md:border-l-2 md:border-line md:pl-8" : "md:grid-cols-2"}`}>
          {content}
          <div className="flex flex-col gap-6 md:items-end">
            {footer.template === "columns" && <div className="grid w-full max-w-sm grid-cols-2 gap-4">{links(footer.links)}</div>}
            {footer.template !== "columns" && <nav className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end" aria-label="Footer">{links(footer.links)}</nav>}
            {footer.showSocials && socialLinks.length > 0 && <div className="flex flex-wrap gap-2 md:justify-end">{socialLinks.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer noopener" aria-label={label} title={label} className="grid h-8 min-w-8 place-items-center rounded-md border border-line px-1.5 text-[0.65rem] font-semibold text-muted hover:border-fg hover:text-fg">{socialMark(label)}</a>)}</div>}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {title}. {footer.copyright}</p>
          <nav className="flex flex-wrap gap-4" aria-label="Policies">{links(footer.policyLinks)}</nav>
        </div>
      </div>
    </footer>
  );
}

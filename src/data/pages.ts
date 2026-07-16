import aboutFeatureContext from '../assets/generated/about-feature-context.png';
import aboutHeroConnection from '../assets/generated/about-hero-connection.png';
import awardsFeatureRecord from '../assets/generated/awards-feature-record.png';
import awardsHeroRecognition from '../assets/generated/awards-hero-recognition.png';
import processFeatureEvidence from '../assets/generated/process-feature-evidence.png';
import processHeroReview from '../assets/generated/process-hero-review.png';
import standardFeatureTrust from '../assets/generated/standard-feature-trust.png';
import standardHeroFramework from '../assets/generated/standard-hero-framework.png';
import workBrand from '../assets/generated/work-brand.png';
import workDigitalProducts from '../assets/generated/work-digital-products.png';
import workFeatureAudience from '../assets/generated/work-feature-audience.png';
import workHeroStudio from '../assets/generated/work-hero-studio.png';
import workOrganisations from '../assets/generated/work-organisations.png';
import workPortfolios from '../assets/generated/work-portfolios.png';
import type { EditorialPageContent, UtilityPageContent } from '../lib/content/types';

export const editorialPages = {
  awards: {
    slug: 'awards',
    seo: {
      title: 'Website Awards & Global Recognition | Best Website Awards',
      description:
        'Discover how Best Website Awards recognises purposeful, accessible and effective websites through evidence-led review and meaningful global recognition.'
    },
    hero: {
      title: 'Recognition built on the work.',
      summary:
        'A business-led award for websites with clear purpose, considered execution and meaningful value.',
      primaryAction: { label: 'View the standard', href: '/standard' },
      secondaryAction: { label: 'See the process', href: '/process' },
      image: {
        src: awardsHeroRecognition,
        alt: 'Cobalt glass portal rising from a precise white architectural plinth'
      },
      frameLabel: 'The awards',
      visualIndex: 'BWA / 01'
    },
    introduction: {
      title: 'A website is evidence.',
      body: [
        'It shows how an organisation thinks, communicates and serves the people it needs to reach.',
        'Best Website Awards recognises the websites that turn that responsibility into clear, useful and memorable digital work.'
      ]
    },
    primaryCollection: {
      title: 'What gives recognition meaning',
      variant: 'columns',
      items: [
        {
          id: 'merit',
          index: '01',
          title: 'Merit in context',
          summary:
            'Work is understood through its purpose, audience and responsibility—not by surface style alone.'
        },
        {
          id: 'evidence',
          index: '02',
          title: 'Evidence over claims',
          summary:
            'Clear decisions, complete execution and meaningful outcomes make quality easier to recognise.'
        },
        {
          id: 'usefulness',
          index: '03',
          title: 'Recognition with use',
          summary:
            'A clear record helps clients, partners, teams and audiences understand why the work matters.'
        }
      ]
    },
    secondaryCollection: {
      title: 'What recognition can make visible',
      summary: 'The value extends beyond a single announcement.',
      variant: 'rows',
      items: [
        {
          id: 'organisation',
          index: '01',
          title: 'Organisational quality',
          summary:
            'A strong website can demonstrate clarity, attention and respect for the people an organisation serves.'
        },
        {
          id: 'team',
          index: '02',
          title: 'The team behind it',
          summary:
            'Recognition gives strategy, design, content and technical craft a shared place in the story.'
        },
        {
          id: 'record',
          index: '03',
          title: 'A public record',
          summary:
            'A concise, understandable account of the work gives recognition value after the moment has passed.'
        }
      ]
    },
    feature: {
      title: 'Credibility should be legible.',
      body: [
        'Good recognition explains what was recognised, the context in which it was considered and why the work deserves attention.',
        'That clarity is what turns an award into useful proof for organisations and the people behind them.'
      ],
      image: {
        src: awardsFeatureRecord,
        alt: 'Layered clear and cobalt glass with a restrained brass datum'
      },
      imagePosition: 'right',
      tone: 'soft'
    },
    statement: {
      title: 'Powered by Global Business Excellence Awards.',
      summary:
        'Best Website Awards brings a focused digital lens to a wider perspective on credible, purposeful business excellence.'
    },
    closing: {
      title: 'Understand what strong work demonstrates.',
      summary: 'Explore the connected measures behind meaningful website excellence.',
      primaryAction: { label: 'View the standard', href: '/standard' },
      secondaryAction: { label: 'Work we recognise', href: '/work' }
    }
  },
  work: {
    slug: 'work',
    seo: {
      title: 'Websites We Recognise | Best Website Awards',
      description:
        'Explore the organisational, brand, commerce, service and portfolio websites considered through the Best Website Awards evaluation standard.',
      pageType: 'CollectionPage'
    },
    hero: {
      title: 'Different websites. One serious standard.',
      summary:
        'The work may serve different people and ambitions. Its purpose should still be clear in every decision.',
      primaryAction: { label: 'View the standard', href: '/standard' },
      secondaryAction: { label: 'Explore the awards', href: '/awards' },
      image: {
        src: workHeroStudio,
        alt: 'Refined digital design studio with a website composition on screen'
      },
      frameLabel: 'Work in context',
      visualIndex: 'BWA / 02'
    },
    introduction: {
      title: 'Quality has to fit the work.',
      body: [
        'A public-service website, an international brand platform and an independent portfolio do not have the same job.',
        'Each can be exceptional when it understands its audience, fulfils its purpose and delivers the experience with care.'
      ]
    },
    primaryCollection: {
      title: 'Work with a reason to be recognised',
      summary: 'These are broad kinds of work, not confirmed award categories.',
      variant: 'media',
      items: [
        {
          id: 'organisations',
          index: '01',
          title: 'Organisations & services',
          summary:
            'Websites that help people understand, trust or access an organisation and what it provides.',
          image: {
            src: workOrganisations,
            alt: 'Contemporary glass and timber headquarters in a landscaped setting'
          }
        },
        {
          id: 'brands',
          index: '02',
          title: 'Brands & campaigns',
          summary:
            'Distinctive experiences that turn positioning and ideas into clear audience connection.',
          image: {
            src: workBrand,
            alt: 'Sculptural blue glass form in a precise campaign still life'
          }
        },
        {
          id: 'commerce',
          index: '03',
          title: 'Commerce & platforms',
          summary:
            'Useful digital journeys that make discovery, decisions and action feel coherent and trustworthy.',
          image: {
            src: workDigitalProducts,
            alt: 'Modular blue glass and graphite forms arranged as a connected system'
          }
        },
        {
          id: 'portfolios',
          index: '04',
          title: 'Portfolios & practice',
          summary:
            'Focused websites that make expertise, thinking and a distinctive point of view visible.',
          image: {
            src: workPortfolios,
            alt: 'Creative studio table with paper studies and a blue architectural model'
          }
        }
      ]
    },
    secondaryCollection: {
      title: 'Context changes the question',
      variant: 'columns',
      items: [
        {
          id: 'audience',
          index: '01',
          title: 'Who must it serve?',
          summary: 'The needs, abilities and expectations of the people using the website.'
        },
        {
          id: 'job',
          index: '02',
          title: 'What must it do?',
          summary:
            'The information, decisions or actions the experience is responsible for enabling.'
        },
        {
          id: 'outcome',
          index: '03',
          title: 'What changed?',
          summary:
            'The useful outcome the work was designed to support or has evidence of creating.'
        }
      ]
    },
    feature: {
      title: 'Built for people, not a judging room.',
      body: [
        'The most convincing websites make sense where they are actually used—across devices, moments and levels of familiarity.',
        'Visual distinction matters. Usefulness, access and trust are what make it last.'
      ],
      image: {
        src: workFeatureAudience,
        alt: 'A responsive website being used across laptop, tablet and phone'
      },
      imagePosition: 'left',
      tone: 'white'
    },
    statement: {
      title: 'The work is not compared to a template.',
      summary: 'It is understood through what it set out to do and how completely it delivers.'
    },
    closing: {
      title: 'See the standard behind the recognition.',
      summary: 'Four connected measures bring structure to a wide range of digital work.',
      primaryAction: { label: 'View the standard', href: '/standard' },
      secondaryAction: { label: 'See the process', href: '/process' }
    }
  },
  standard: {
    slug: 'standard',
    seo: {
      title: 'Website Evaluation Criteria | Best Website Awards',
      description:
        'Understand the Best Website Awards criteria for design and experience, performance and accessibility, content and purpose, innovation and impact.'
    },
    hero: {
      title: 'A standard designed to see the whole website.',
      summary:
        'Four connected measures keep attention on experience, execution, purpose and meaningful value.',
      primaryAction: { label: 'Follow the process', href: '/process' },
      secondaryAction: { label: 'Work we recognise', href: '/work' },
      image: {
        src: standardHeroFramework,
        alt: 'Four connected cobalt and clear glass modules on a precision grid'
      },
      frameLabel: 'The standard',
      visualIndex: 'BWA / 03'
    },
    introduction: {
      title: 'Excellence is connected.',
      body: [
        'A beautiful interface cannot compensate for confusion. Strong technology cannot rescue unclear purpose.',
        'The standard considers how design, performance, content and impact reinforce one another for the audience the website exists to serve.'
      ]
    },
    primaryCollection: {
      title: 'The four measures',
      variant: 'rows',
      items: [
        {
          id: 'design-experience',
          index: '01',
          title: 'Design & Experience',
          summary:
            'Structure, interface and interaction working together to make the experience clear, coherent and distinctive.'
        },
        {
          id: 'performance-accessibility',
          index: '02',
          title: 'Performance & Accessibility',
          summary:
            'Fast, stable and inclusive delivery that respects people’s time, devices and abilities.'
        },
        {
          id: 'content-purpose',
          index: '03',
          title: 'Content & Purpose',
          summary:
            'Useful communication aligned with a defined audience, organisational need and reason for the website to exist.'
        },
        {
          id: 'innovation-impact',
          index: '04',
          title: 'Innovation & Impact',
          summary:
            'Relevant original thinking and meaningful value that extend beyond visual novelty.'
        }
      ]
    },
    secondaryCollection: {
      title: 'The lens around every measure',
      summary: 'The same quality can look different when the purpose and responsibility change.',
      variant: 'columns',
      items: [
        {
          id: 'completeness',
          index: '01',
          title: 'Complete execution',
          summary: 'Responsive behaviour, navigation and key journeys working as one system.'
        },
        {
          id: 'trust',
          index: '02',
          title: 'Trust by design',
          summary: 'Clear information, dependable behaviour and appropriate care for the user.'
        },
        {
          id: 'evidence',
          index: '03',
          title: 'Evidence in context',
          summary:
            'Decisions and outcomes understood in relation to the work’s real constraints and goals.'
        }
      ]
    },
    feature: {
      title: 'Quality people can feel.',
      body: [
        'Speed, access, clarity and trust are not background details. They shape whether a website works for the people depending on it.',
        'Technical quality is considered as part of the experience—not as a separate box to tick.'
      ],
      image: {
        src: standardFeatureTrust,
        alt: 'Clear and cobalt glass planes aligned on a precise technical grid'
      },
      imagePosition: 'right',
      tone: 'soft'
    },
    statement: {
      title: 'Excellence is coherent, not cosmetic.',
      summary:
        'The strongest websites make purpose, experience and execution feel like one considered decision.'
    },
    closing: {
      title: 'See how the work is presented.',
      summary: 'Follow the focused path from context and evidence to meaningful recognition.',
      primaryAction: { label: 'Follow the process', href: '/process' },
      secondaryAction: { label: 'Explore the awards', href: '/awards' }
    }
  },
  process: {
    slug: 'process',
    seo: {
      title: 'Website Award Review Process | Best Website Awards',
      description:
        'Learn how websites are presented, reviewed against four connected measures and considered for recognition through Best Website Awards.'
    },
    hero: {
      title: 'Make the work understandable.',
      summary:
        'A focused path keeps the website, its purpose and the evidence behind it at the centre.',
      primaryAction: { label: 'Explore the standard', href: '/standard' },
      secondaryAction: { label: 'Read common questions', href: '/faq' },
      image: {
        src: processHeroReview,
        alt: 'Three-stage website review progression arranged on a white studio table'
      },
      frameLabel: 'Recognition process',
      visualIndex: 'BWA / 04'
    },
    introduction: {
      title: 'Context first. Then consideration.',
      body: [
        'A website deserves to be understood for the job it had to do—not reduced to a screenshot.',
        'The process brings the work, its decisions and the evidence of its value into one clear account.'
      ]
    },
    primaryCollection: {
      title: 'Three focused stages',
      variant: 'columns',
      items: [
        {
          id: 'present',
          index: '01',
          title: 'Present the work',
          summary:
            'Share the website and explain its purpose, audience, context and the team behind it.'
        },
        {
          id: 'review',
          index: '02',
          title: 'Considered review',
          summary:
            'The complete work is considered through the four measures and in relation to what it set out to achieve.'
        },
        {
          id: 'recognition',
          index: '03',
          title: 'Recognition',
          summary:
            'Work that demonstrates meaningful excellence can be recognised with a clear account of why it matters.'
        }
      ]
    },
    secondaryCollection: {
      title: 'What a strong presentation makes clear',
      variant: 'rows',
      items: [
        {
          id: 'purpose',
          index: '01',
          title: 'Purpose & audience',
          summary: 'Why the website exists, who it serves and what those people need from it.'
        },
        {
          id: 'decisions',
          index: '02',
          title: 'Decisions & delivery',
          summary:
            'The important strategic, creative and technical choices visible in the final work.'
        },
        {
          id: 'outcomes',
          index: '03',
          title: 'Outcomes & evidence',
          summary:
            'What the website enables and the credible evidence available to support its value.'
        }
      ]
    },
    feature: {
      title: 'Show the reasoning, not only the result.',
      body: [
        'A polished page can show the outcome. A useful case for recognition also explains the challenge, the choices and what changed.',
        'Programme-specific entry requirements will be published through the official awards channels.'
      ],
      image: {
        src: processFeatureEvidence,
        alt: 'Website case-study materials, responsive layouts and abstract evidence charts'
      },
      imagePosition: 'right',
      tone: 'soft'
    },
    statement: {
      title: 'Clarity gives good work the strongest voice.',
      summary: 'A clear account helps quality, relevance and impact come into view.'
    },
    closing: {
      title: 'Begin with the standard.',
      summary: 'Understand the connected measures before presenting the work.',
      primaryAction: { label: 'Explore the standard', href: '/standard' },
      secondaryAction: { label: 'Contact us', href: '/contact' }
    }
  },
  about: {
    slug: 'about',
    seo: {
      title: 'About Best Website Awards | Global Digital Recognition',
      description:
        'Learn how Best Website Awards brings a focused website excellence programme to the global business perspective of Global Business Excellence Awards.',
      pageType: 'AboutPage'
    },
    hero: {
      title: 'Digital excellence in a wider business world.',
      summary:
        'A focused award for the websites through which organisations are understood, trusted and chosen.',
      primaryAction: { label: 'Explore the awards', href: '/awards' },
      secondaryAction: { label: 'Work we recognise', href: '/work' },
      image: {
        src: aboutHeroConnection,
        alt: 'Cobalt glass architectural bridge connecting two refined environments'
      },
      frameLabel: 'About BWA',
      visualIndex: 'BWA / 05'
    },
    introduction: {
      title: 'Why this award exists.',
      body: [
        'Websites influence how organisations enter markets, earn confidence, communicate value and serve people.',
        'Best Website Awards exists to recognise the quality of that work with a standard shaped by both digital craft and business purpose.'
      ]
    },
    primaryCollection: {
      title: 'One focused point of view',
      variant: 'columns',
      items: [
        {
          id: 'business',
          index: '01',
          title: 'Business perspective',
          summary:
            'The website is considered as part of how an organisation creates trust and value.'
        },
        {
          id: 'digital',
          index: '02',
          title: 'Digital focus',
          summary: 'Design, technology and content are understood as one connected experience.'
        },
        {
          id: 'recognition',
          index: '03',
          title: 'Useful recognition',
          summary:
            'The record should explain the achievement clearly enough to matter beyond the event.'
        }
      ]
    },
    secondaryCollection: {
      title: 'The wider platform',
      summary:
        'Global Business Excellence Awards recognises leadership, enterprise, innovation and service excellence across the UK, Sri Lanka and international markets.',
      variant: 'rows',
      items: [
        {
          id: 'platform',
          index: '01',
          title: 'Public awards platform',
          summary:
            'Global Business Excellence Awards is organised by London Business Consultancy in London, United Kingdom.'
        },
        {
          id: 'connection',
          index: '02',
          title: 'Connected markets',
          summary:
            'Its wider perspective connects business achievement across the United Kingdom, Sri Lanka and international markets.'
        },
        {
          id: 'focus',
          index: '03',
          title: 'A dedicated digital lens',
          summary:
            'Best Website Awards applies that context to the websites and digital experiences shaping modern organisations.'
        }
      ]
    },
    feature: {
      title: 'Global in outlook. Clear in purpose.',
      body: [
        'The strongest digital work can emerge from organisations of different sizes, sectors and markets.',
        'A consistent standard makes that work easier to understand on its own merit and in its own context.'
      ],
      image: {
        src: aboutFeatureContext,
        alt: 'Refined global business meeting space with cobalt glass and a brass connection line'
      },
      imagePosition: 'right',
      tone: 'soft'
    },
    statement: {
      title: 'Powered by Global Business Excellence Awards.',
      summary:
        'A wider business perspective gives digital recognition context, relevance and a useful public purpose.'
    },
    closing: {
      title: 'Explore what we recognise.',
      summary:
        'See how different kinds of digital work are understood through one connected standard.',
      primaryAction: { label: 'Work we recognise', href: '/work' },
      secondaryAction: { label: 'Contact us', href: '/contact' }
    }
  }
} satisfies Record<string, EditorialPageContent>;

export const utilityPages = {
  contact: {
    slug: 'contact',
    seo: {
      title: 'Contact Best Website Awards | Programme Enquiries',
      description:
        'Contact Best Website Awards about website eligibility, evaluation criteria, presenting work, recognition or official programme information.',
      pageType: 'ContactPage'
    },
    title: 'Start a clear conversation.',
    introduction:
      'For questions about Best Website Awards, the recognition standard or programme information, contact the team through the official channel below.',
    sections: [
      {
        title: 'General enquiries',
        body: [
          'Email info@gbeaward.com for enquiries connected to Best Website Awards.',
          'Messages are handled through Global Business Excellence Awards, which powers this initiative.'
        ]
      },
      {
        title: 'Help us understand the enquiry',
        body: [
          'You may include your name, organisation, website address and a concise explanation of what you would like to discuss.',
          'Current programme details are published through official Best Website Awards and Global Business Excellence Awards channels.'
        ]
      }
    ],
    action: { label: 'Email the team', href: 'mailto:info@gbeaward.com' }
  },
  faq: {
    slug: 'faq',
    seo: {
      title: 'Website Award FAQs | Eligibility, Criteria & Review',
      description:
        'Find answers about Best Website Awards eligibility, website types, evaluation criteria, evidence, review, public voting, recognition and programme details.',
      pageType: 'FAQPage'
    },
    title: 'Questions, answered with clarity.',
    introduction:
      'A complete guide to who can present work, what is considered and how website excellence is recognised.',
    sections: [
      {
        title: 'What is Best Website Awards?',
        body: [
          'Best Website Awards is a global recognition programme for websites that demonstrate purposeful design, strong experience, dependable execution, useful content and meaningful impact.',
          'It is powered by Global Business Excellence Awards and considers websites in the wider context of how organisations communicate, serve people and create value.'
        ]
      },
      {
        title: 'Is Best Website Awards open globally?',
        body: [
          'Yes. Websites from any country or market may be presented, subject to the eligibility requirements published for the relevant programme.',
          'The work is considered on its own purpose, audience and context rather than being judged by where the organisation is based.'
        ]
      },
      {
        title: 'Who can present a website?',
        body: [
          'A website may be presented by its owner, an authorised internal team, or an agency, studio, developer or specialist partner acting with the owner’s permission.',
          'The presentation should identify the organisation that owns the website and the contributors whose work should be credited.'
        ]
      },
      {
        title: 'Is a prior nomination required?',
        body: [
          'No prior nomination is required. An eligible website may be presented by its owner or an authorised contributor when the relevant programme is open for entries.'
        ]
      },
      {
        title: 'What kinds of websites can be considered?',
        body: [
          'The programme can consider corporate and organisational websites, brand and campaign experiences, commerce and service platforms, public-interest and purpose-led websites, portfolios, specialist practices and other substantial web experiences.',
          'These descriptions explain the range of relevant work. Formal award categories, where used, are published with the programme information for each cycle.'
        ]
      },
      {
        title: 'Can both new websites and redesigns be presented?',
        body: [
          'Yes. A newly launched website, a substantial redesign or a meaningful redevelopment may be considered when the work is complete enough to be experienced and reviewed as a coherent website.'
        ]
      },
      {
        title: 'Does the website need to be live?',
        body: [
          'The website should be live, functional and available for review during the assessment period. Reviewers need to experience the real responsive website rather than only static mock-ups or a presentation video.',
          'If essential parts of the experience require controlled access, contact the awards team before presenting the work.'
        ]
      },
      {
        title: 'Can websites in languages other than English be considered?',
        body: [
          'Yes. Websites may serve audiences in any language. The supporting presentation and evidence should be provided in English, or include a clear English translation, so the purpose and outcomes can be understood consistently.'
        ]
      },
      {
        title: 'Is there public voting?',
        body: [
          'No. Best Website Awards does not use public voting to determine recognition.',
          'Websites are considered through a structured review against the published standard, keeping the result focused on the work, its context and its evidence.'
        ]
      },
      {
        title: 'What are the evaluation criteria?',
        body: [
          'The standard brings together four connected measures: Design & Experience, Performance & Accessibility, Content & Purpose, and Innovation & Impact.',
          'No single measure is treated as a substitute for the others. The complete website is considered as one experience.'
        ]
      },
      {
        title: 'How is the website’s context taken into account?',
        body: [
          'Review considers what the website exists to do, who it serves, the responsibility it carries, the constraints behind it and the outcomes it is intended to support.',
          'A public-service website, an international brand platform and an independent portfolio can therefore demonstrate excellence in different but equally credible ways.'
        ]
      },
      {
        title: 'How important are accessibility and performance?',
        body: [
          'They are core parts of the standard. A recognised website should respect different devices, connection conditions and user abilities through responsive, stable and inclusive execution.',
          'Accessibility and performance are considered as qualities of the experience, not as optional technical extras.'
        ]
      },
      {
        title: 'What evidence should support the work?',
        body: [
          'A strong presentation explains the website’s purpose, audience, challenge, important decisions, delivery and outcomes. Useful evidence may include research findings, accessibility work, performance improvements, audience response or measurable organisational results.',
          'Evidence should be relevant, accurate and attributable. Unsupported promotional claims do not carry the same weight as a clear account of the work.'
        ]
      },
      {
        title: 'Do traffic, budget or organisation size determine the result?',
        body: [
          'No. Scale can provide context, but a large audience or budget does not by itself demonstrate website excellence.',
          'The review focuses on how intelligently and completely the website fulfils its purpose for the people it is intended to serve.'
        ]
      },
      {
        title: 'Who reviews the websites?',
        body: [
          'Websites are considered by reviewers selected for relevant professional experience across digital strategy, design, content, technology, accessibility, user experience and business.',
          'Reviewers apply the same published framework and are expected to consider conflicts of interest before taking part in an assessment.'
        ]
      },
      {
        title: 'How are agencies and project contributors credited?',
        body: [
          'The website owner remains central to the recognition record, while authorised agencies, studios, internal teams and specialist contributors may be credited for the roles confirmed in the presentation.',
          'Entrants are responsible for supplying accurate names, roles and permissions.'
        ]
      },
      {
        title: 'Can websites using AI or third-party platforms be considered?',
        body: [
          'Yes. The use of artificial intelligence, content-management systems, commerce platforms, design systems or other third-party technology does not prevent consideration.',
          'The presenting team remains responsible for lawful use, originality where claimed, accessibility, accuracy and the quality of the final experience. Material use of AI should be disclosed when it is relevant to understanding the work.'
        ]
      },
      {
        title: 'What happens if the website changes after it is presented?',
        body: [
          'Websites naturally evolve. The review is based on the version available during the assessment period together with the evidence supplied in the presentation.',
          'A material change that affects the purpose, ownership or core experience should be disclosed to the awards team.'
        ]
      },
      {
        title: 'How are intellectual property and confidential information handled?',
        body: [
          'The person presenting the work must have permission to share the website, project information, images, results and contributor details included in the presentation.',
          'Only information suitable for review and, where recognition is granted, public attribution should be supplied. Sensitive commercial or personal information should not be included unless an approved process expressly requests it.'
        ]
      },
      {
        title: 'What does recognition communicate?',
        body: [
          'Recognition communicates that the website demonstrated meaningful quality against the published standard in its own context.',
          'The resulting record is intended to help audiences, clients, partners and teams understand what was achieved and why the work deserves attention. Programme-specific recognition materials are confirmed in the official guidance.'
        ]
      },
      {
        title: 'When are programme dates, fees and entry instructions published?',
        body: [
          'The entry period, submission method, eligibility details, any applicable fees and programme-specific requirements are published together through official Best Website Awards and Global Business Excellence Awards channels.',
          'Information from third-party listings should be checked against the current official programme guidance before action is taken.'
        ]
      },
      {
        title: 'How can I ask a question about a website?',
        body: [
          'Contact info@gbeaward.com with the website address, the organisation or team involved and a concise explanation of what you would like to confirm.'
        ]
      }
    ],
    action: { label: 'Contact the team', href: '/contact' }
  },
  privacy: {
    slug: 'privacy-policy',
    seo: {
      title: 'Privacy Policy | Best Website Awards',
      description:
        'Read how the Best Website Awards public website handles contact information, technical request data, external services and privacy enquiries.',
      noIndex: true
    },
    title: 'Privacy, explained clearly.',
    introduction:
      'This policy describes how information is handled when you visit the Best Website Awards public website or contact the team.',
    sections: [
      {
        title: 'Information you provide',
        body: [
          'If you contact us by email, we receive the information you choose to include in that correspondence.',
          'This public website does not currently provide account registration or online forms.'
        ]
      },
      {
        title: 'Technical information',
        body: [
          'Hosting and security services may process standard request information such as IP address, browser details, requested pages and timestamps to deliver and protect the website.'
        ]
      },
      {
        title: 'How information is used',
        body: [
          'Information may be used to respond to enquiries, operate and secure the website, understand technical issues and comply with applicable obligations.',
          'Personal information is not sold through this website.'
        ]
      },
      {
        title: 'External services and links',
        body: [
          'Links to Global Business Excellence Awards and other external services are governed by their own privacy practices.'
        ]
      },
      {
        title: 'Questions and requests',
        body: ['For privacy questions relating to Best Website Awards, contact info@gbeaward.com.']
      }
    ],
    action: { label: 'Contact us', href: 'mailto:info@gbeaward.com' }
  },
  terms: {
    slug: 'terms',
    seo: {
      title: 'Terms of Use | Best Website Awards',
      description:
        'Read the terms governing use of the Best Website Awards public website, programme information, intellectual property and external links.',
      noIndex: true
    },
    title: 'Terms built for clarity.',
    introduction:
      'These terms apply to use of the Best Website Awards public website. By using the site, you agree to use it lawfully and responsibly.',
    sections: [
      {
        title: 'Public information',
        body: [
          'Content on this website explains the purpose and general framework of Best Website Awards.',
          'Dates, entry requirements, fees, eligibility and other programme-specific details are only confirmed when published through an official channel.'
        ]
      },
      {
        title: 'No automatic entitlement',
        body: [
          'Viewing this website, contacting the team or presenting digital work does not by itself create an entitlement to entry, assessment or recognition.'
        ]
      },
      {
        title: 'Intellectual property',
        body: [
          'The Best Website Awards name, visual identity, website design and original content may not be reproduced or represented as your own without permission.'
        ]
      },
      {
        title: 'External links',
        body: [
          'External websites are provided for context or convenience. Their content and availability remain the responsibility of their respective operators.'
        ]
      },
      {
        title: 'Changes',
        body: [
          'These terms may be updated as the website and programme develop. The version published on this page is the current public version.'
        ]
      }
    ],
    action: { label: 'Contact us', href: 'mailto:info@gbeaward.com' }
  },
  cookies: {
    slug: 'cookies',
    seo: {
      title: 'Cookie Notice | Best Website Awards',
      description:
        'Read how the Best Website Awards public website approaches cookies, technical delivery mechanisms and future consent-controlled services.',
      noIndex: true
    },
    title: 'A minimal approach to cookies.',
    introduction:
      'The Best Website Awards public website is designed to work without non-essential cookies.',
    sections: [
      {
        title: 'Current use',
        body: [
          'The current public site does not use advertising or account-session cookies.',
          'Hosting and security infrastructure may use technical mechanisms needed to deliver and protect requests.'
        ]
      },
      {
        title: 'Future changes',
        body: [
          'If analytics, forms or other services that use non-essential cookies are introduced, this notice and any necessary consent controls will be updated before that use begins.'
        ]
      },
      {
        title: 'Browser controls',
        body: [
          'Most browsers allow you to review, block or remove stored cookies through their privacy settings.'
        ]
      }
    ],
    action: { label: 'Privacy policy', href: '/privacy-policy' }
  },
  notFound: {
    slug: '404',
    seo: {
      title: 'Page Not Found | Best Website Awards',
      description: 'The requested Best Website Awards page could not be found.',
      noIndex: true
    },
    title: 'This page is out of view.',
    introduction:
      'The address may have changed or the page may no longer be available. Return to the awards and continue exploring exceptional digital work.',
    sections: [],
    action: { label: 'Return home', href: '/' }
  }
} satisfies Record<string, UtilityPageContent>;

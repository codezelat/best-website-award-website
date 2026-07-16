import heroArchitecture from '../assets/generated/hero-architecture.png';
import workBrand from '../assets/generated/work-brand.png';
import workDigitalProducts from '../assets/generated/work-digital-products.png';
import workOrganisations from '../assets/generated/work-organisations.png';
import workPortfolios from '../assets/generated/work-portfolios.png';
import type { EditorialPageContent, UtilityPageContent } from '../lib/content/types';

export const editorialPages = {
  awards: {
    slug: 'awards',
    seo: {
      title: 'The Awards | Best Website Awards',
      description:
        'Discover the purpose behind Best Website Awards and the principles that guide meaningful digital recognition.'
    },
    hero: {
      title: 'Recognition with meaning.',
      summary: 'A considered standard for digital work that creates value.',
      primaryAction: { label: 'View the standard', href: '/standard' },
      secondaryAction: { label: 'See the process', href: '/process' },
      image: {
        src: heroArchitecture,
        alt: 'Sculptural white architecture beneath a clear blue sky',
        position: 'center 54%'
      },
      frameLabel: 'The awards',
      visualIndex: 'BWA / 01'
    },
    introduction: {
      title: 'What the awards stand for.',
      body: [
        'A website is often where an organisation becomes visible, useful and understood.',
        'Best Website Awards recognises the thinking and execution that turn that responsibility into meaningful digital work.'
      ]
    },
    primaryCollection: {
      title: 'Three principles behind the recognition',
      variant: 'columns',
      items: [
        {
          id: 'purpose',
          index: '01',
          title: 'Purpose before decoration',
          summary:
            'Strong work begins with a clear reason to exist and a clear understanding of whom it serves.'
        },
        {
          id: 'experience',
          index: '02',
          title: 'Experience in every detail',
          summary:
            'Design, content and technology should work together with clarity, care and consistency.'
        },
        {
          id: 'impact',
          index: '03',
          title: 'Impact beyond the screen',
          summary:
            'The strongest websites make useful connections between people, organisations and opportunity.'
        }
      ]
    },
    feature: {
      title: 'Recognition in context.',
      body: [
        'Digital excellence is not one visual style or one kind of organisation. It is the alignment of purpose, audience, craft and outcome.',
        'That wider view keeps recognition relevant to the work itself.'
      ],
      image: {
        src: workBrand,
        alt: 'A sculptural blue glass form arranged in a precise studio composition'
      },
      imagePosition: 'right',
      tone: 'soft'
    },
    statement: {
      title: 'Powered by Global Business Excellence Awards.',
      summary:
        'Best Website Awards connects digital craft with a wider perspective on credible, purposeful business excellence.'
    },
    closing: {
      title: 'See what excellence looks like.',
      summary: 'Explore the connected measures behind meaningful digital work.',
      primaryAction: { label: 'View the standard', href: '/standard' },
      secondaryAction: { label: 'Work we recognise', href: '/work' }
    }
  },
  work: {
    slug: 'work',
    seo: {
      title: 'Work We Recognise | Best Website Awards',
      description:
        'Explore the kinds of websites and digital experiences considered through the Best Website Awards standard.'
    },
    hero: {
      title: 'Digital work, seen in context.',
      summary: 'The strongest websites make their purpose clear in every decision.',
      primaryAction: { label: 'View the standard', href: '/standard' },
      secondaryAction: { label: 'Explore the awards', href: '/awards' },
      image: {
        src: workOrganisations,
        alt: 'Contemporary glass and timber headquarters in a landscaped setting'
      },
      frameLabel: 'Work in context',
      visualIndex: 'BWA / 02'
    },
    introduction: {
      title: 'Different work. One clear expectation.',
      body: [
        'Websites differ in audience, ambition and responsibility. Their value can only be understood in that context.',
        'What connects exceptional work is clarity of purpose and the quality of the experience built around it.'
      ]
    },
    primaryCollection: {
      title: 'The work we recognise',
      summary: 'These are kinds of work, not fixed award categories.',
      variant: 'media',
      items: [
        {
          id: 'organisations',
          index: '01',
          title: 'Websites for organisations',
          summary: 'Purpose-led experiences built to inform, serve and earn trust.',
          image: {
            src: workOrganisations,
            alt: 'Contemporary glass and timber headquarters in a landscaped setting'
          }
        },
        {
          id: 'brands',
          index: '02',
          title: 'Brand-led experiences',
          summary:
            'Distinctive work that turns strategy into something people can understand and remember.',
          image: {
            src: workBrand,
            alt: 'Sculptural blue glass form in a precise campaign still life'
          }
        },
        {
          id: 'portfolios',
          index: '03',
          title: 'Independent portfolios',
          summary: 'Focused websites that make skill, thinking and point of view visible.',
          image: {
            src: workPortfolios,
            alt: 'Creative studio table with paper studies and a blue architectural model'
          }
        },
        {
          id: 'products',
          index: '04',
          title: 'Digital products',
          summary: 'Useful interfaces that solve real problems with clarity and care.',
          image: {
            src: workDigitalProducts,
            alt: 'Modular blue glass and graphite forms arranged as a connected system'
          }
        }
      ]
    },
    feature: {
      title: 'More than a surface.',
      body: [
        'A website is considered through the relationship between what it communicates, how it behaves and what it enables.',
        'Visual distinction matters most when it supports a coherent experience.'
      ],
      image: {
        src: workPortfolios,
        alt: 'Paper studies and a blue architectural model on a creative studio table'
      },
      imagePosition: 'left',
      tone: 'white'
    },
    statement: {
      title: 'What matters is how well the work serves its purpose.',
      summary: 'Context changes. The expectation of clear, thoughtful execution does not.'
    },
    closing: {
      title: 'Understand the measures.',
      summary: 'See how design, performance, content and impact are considered together.',
      primaryAction: { label: 'View the standard', href: '/standard' },
      secondaryAction: { label: 'See the process', href: '/process' }
    }
  },
  standard: {
    slug: 'standard',
    seo: {
      title: 'The Standard | Best Website Awards',
      description:
        'Understand the four connected measures used to consider meaningful website excellence.'
    },
    hero: {
      title: 'A clear standard for exceptional work.',
      summary: 'Four measures keep attention on what makes a website genuinely effective.',
      primaryAction: { label: 'Follow the process', href: '/process' },
      secondaryAction: { label: 'Work we recognise', href: '/work' },
      image: {
        src: workDigitalProducts,
        alt: 'Modular blue glass and graphite forms arranged as a connected system'
      },
      frameLabel: 'The standard',
      visualIndex: 'BWA / 03'
    },
    introduction: {
      title: 'Four connected measures.',
      body: [
        'No single quality makes a website exceptional. The standard considers how design, technology, content and impact reinforce one another.',
        'Each measure is viewed in relation to the website’s purpose and audience.'
      ]
    },
    primaryCollection: {
      title: 'The evaluation framework',
      variant: 'rows',
      items: [
        {
          id: 'design-experience',
          index: '01',
          title: 'Design & Experience',
          summary:
            'Clarity of structure, quality of interface and thoughtfulness of interaction across the complete experience.'
        },
        {
          id: 'performance-accessibility',
          index: '02',
          title: 'Performance & Accessibility',
          summary:
            'Fast, stable and inclusive by default—respecting people’s time, devices and abilities.'
        },
        {
          id: 'content-purpose',
          index: '03',
          title: 'Content & Purpose',
          summary:
            'Clear communication and useful information aligned with a defined purpose and audience.'
        },
        {
          id: 'innovation-impact',
          index: '04',
          title: 'Innovation & Impact',
          summary:
            'Original thinking with meaningful relevance and an outcome that extends beyond visual novelty.'
        }
      ]
    },
    feature: {
      title: 'Considered as a whole.',
      body: [
        'Websites are complex. The four measures are intentionally connected and considered together.',
        'Context, audience and purpose shape what effective execution looks like.'
      ],
      image: {
        src: heroArchitecture,
        alt: 'Sculptural white architecture beneath a clear blue sky',
        position: 'center 54%'
      },
      imagePosition: 'right',
      tone: 'soft'
    },
    statement: {
      title: 'Excellence is coherent, not cosmetic.',
      summary:
        'Strong work performs with clarity, communicates with purpose and leaves a meaningful impression.'
    },
    closing: {
      title: 'See how recognition works.',
      summary: 'Follow the simple stages that keep the work and its purpose at the centre.',
      primaryAction: { label: 'Follow the process', href: '/process' },
      secondaryAction: { label: 'Explore the awards', href: '/awards' }
    }
  },
  process: {
    slug: 'process',
    seo: {
      title: 'Recognition Process | Best Website Awards',
      description:
        'Follow the clear three-stage path from presenting digital work to meaningful recognition.'
    },
    hero: {
      title: 'A considered path to recognition.',
      summary: 'The work, its purpose and the thinking behind it stay at the centre.',
      primaryAction: { label: 'Explore the standard', href: '/standard' },
      secondaryAction: { label: 'Contact us', href: '/contact' },
      image: {
        src: workPortfolios,
        alt: 'Creative studio table with paper studies and a blue architectural model'
      },
      frameLabel: 'Recognition process',
      visualIndex: 'BWA / 04'
    },
    introduction: {
      title: 'From presentation to recognition.',
      body: [
        'A clear process makes space for the website, its context and the decisions behind it.',
        'Three stages keep the journey understandable without distracting from the work itself.'
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
            'Share the website and explain the purpose, audience and thinking that shaped it.'
        },
        {
          id: 'review',
          index: '02',
          title: 'Considered review',
          summary:
            'The work is considered against the connected measures of the standard and within its context.'
        },
        {
          id: 'recognition',
          index: '03',
          title: 'Recognition',
          summary:
            'Work that demonstrates meaningful excellence can earn recognition through the awards.'
        }
      ]
    },
    secondaryCollection: {
      title: 'What a clear presentation communicates',
      variant: 'rows',
      items: [
        {
          id: 'purpose',
          index: '01',
          title: 'The purpose',
          summary: 'Why the website exists and the change it is intended to support.'
        },
        {
          id: 'audience',
          index: '02',
          title: 'The audience',
          summary: 'Who the experience is for and the needs that guided the work.'
        },
        {
          id: 'outcome',
          index: '03',
          title: 'The outcome',
          summary: 'What the website enables and the value its experience is designed to create.'
        }
      ]
    },
    feature: {
      title: 'Built around the work.',
      body: [
        'The process is intentionally straightforward: a clear presentation, a connected standard and considered recognition.',
        'Published entry guidance will set out the programme-specific requirements for presenting work.'
      ],
      image: {
        src: workDigitalProducts,
        alt: 'Modular blue glass and graphite forms arranged as a connected system'
      },
      imagePosition: 'right',
      tone: 'soft'
    },
    statement: {
      title: 'Clarity makes good work easier to understand.',
      summary: 'A clear account of purpose and audience helps the value of the work come into view.'
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
      title: 'About | Best Website Awards',
      description:
        'Learn why Best Website Awards connects digital craft with a wider perspective on business excellence.',
      pageType: 'AboutPage'
    },
    hero: {
      title: 'Digital excellence, viewed in a wider context.',
      summary:
        'Best Website Awards connects digital craft with a broader standard of business excellence.',
      primaryAction: { label: 'Explore the awards', href: '/awards' },
      secondaryAction: { label: 'Work we recognise', href: '/work' },
      image: {
        src: workOrganisations,
        alt: 'Contemporary glass and timber headquarters in a landscaped setting'
      },
      frameLabel: 'About BWA',
      visualIndex: 'BWA / 05'
    },
    introduction: {
      title: 'Why this award exists.',
      body: [
        'Websites shape how organisations are understood—by their audiences, partners and the wider world.',
        'Best Website Awards creates a focused space to recognise digital work that approaches that responsibility with purpose and care.'
      ]
    },
    primaryCollection: {
      title: 'A focused point of view',
      variant: 'rows',
      items: [
        {
          id: 'purpose',
          index: '01',
          title: 'Purpose',
          summary:
            'Recognition begins with clarity of intent and a meaningful role for the people being served.'
        },
        {
          id: 'craft',
          index: '02',
          title: 'Craft',
          summary:
            'Design, technology and content are considered as connected parts of one complete experience.'
        },
        {
          id: 'value',
          index: '03',
          title: 'Value',
          summary:
            'Strong digital work supports trust, connection and outcomes that matter beyond the screen.'
        }
      ]
    },
    feature: {
      title: 'A focused part of a wider standard.',
      body: [
        'Best Website Awards is dedicated to websites and the digital experiences around them.',
        'Powered by Global Business Excellence Awards, it brings that focus into a broader perspective on credible, purposeful excellence.'
      ],
      image: {
        src: heroArchitecture,
        alt: 'Sculptural white architecture beneath a clear blue sky',
        position: 'center 54%'
      },
      imagePosition: 'right',
      tone: 'soft'
    },
    statement: {
      title: 'Powered by Global Business Excellence Awards.',
      summary:
        'A wider business perspective gives digital recognition context, relevance and credibility.'
    },
    closing: {
      title: 'Explore what we recognise.',
      summary: 'See the different kinds of digital work considered through one connected standard.',
      primaryAction: { label: 'Work we recognise', href: '/work' },
      secondaryAction: { label: 'Contact us', href: '/contact' }
    }
  }
} satisfies Record<string, EditorialPageContent>;

export const utilityPages = {
  contact: {
    slug: 'contact',
    seo: {
      title: 'Contact | Best Website Awards',
      description: 'Contact Best Website Awards for programme and general enquiries.',
      pageType: 'ContactPage'
    },
    title: 'Start a clear conversation.',
    introduction:
      'For questions about Best Website Awards, the recognition standard or future programme information, contact the team through the official channel below.',
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
  privacy: {
    slug: 'privacy-policy',
    seo: {
      title: 'Privacy Policy | Best Website Awards',
      description: 'How the Best Website Awards public website handles information and privacy.'
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
      description: 'Terms governing use of the Best Website Awards public website.'
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
      description: 'Cookie and similar-technology information for the Best Website Awards website.'
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

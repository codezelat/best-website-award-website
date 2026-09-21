import type { ParticipationContent } from '../lib/content/participation';
export const participationContent: ParticipationContent = {
  title: 'Confirm your participation.',
  packages: [
    {
      code: 'A',
      title: 'Company',
      description: 'For the owner of the selected website.',
      benefits: ['1 award trophy and certificate', '1 attendee included', '1 stage presentation']
    },
    {
      code: 'B',
      title: 'Developer / agency',
      description: 'For the creator of the selected website.',
      benefits: ['1 award trophy and certificate', '1 attendee included', '1 stage presentation']
    },
    {
      code: 'C',
      title: 'Together',
      description: 'Company and developer / agency.',
      benefits: [
        '1 shared trophy and 2 separate award certificates',
        '2 attendees included',
        '1 shared stage presentation'
      ]
    }
  ],
  packageNote:
    'Dinner buffet included for every attendee. You can add additional attendees in the next step.',
  extraTrophy:
    'An additional trophy for the same award, with separate company and developer stage presentations.',
  attendeeBenefits: [
    'Full dinner buffet ticket included for each attendee.',
    'Additional attendees receive a dinner buffet ticket only.'
  ]
};

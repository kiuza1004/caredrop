import CardLandingClient from '@/components/pages/CardLandingClient';

export async function generateStaticParams() {
  return [
    { code: 'CHULSOO77' },
    { code: 'YOUNGHEE88' },
  ];
}

export default function CardLandingPage({ params }: { params: { code: string } }) {
  return <CardLandingClient cardCode={params.code} />;
}

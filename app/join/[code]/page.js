import JoinClient from './JoinClient';

export default async function JoinPage({ params }) {
  const { code } = await params;
  return <JoinClient code={code} />;
}

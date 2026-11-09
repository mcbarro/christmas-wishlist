import GroupGate from './group/GroupGate';
import { useGroup } from './group/GroupProvider';
import WishlistApp from './WishlistApp';

export default function App() {
  const { status } = useGroup();

  if (status === 'approved') return <WishlistApp />;
  return <GroupGate />;
}

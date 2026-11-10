import ChristmasDecor from './components/ChristmasDecor';
import GroupGate from './group/GroupGate';
import { useGroup } from './group/GroupProvider';
import WishlistApp from './WishlistApp';

export default function App() {
  const { status } = useGroup();

  return (
    <>
      <ChristmasDecor />
      {status === 'approved' ? <WishlistApp /> : <GroupGate />}
    </>
  );
}

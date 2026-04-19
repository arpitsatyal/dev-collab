import { Container, Alert } from "@mantine/core";
import Layout from "../../../../components/Layout/Layout";
import { withAuth } from "../../../../guards/withAuth";
import { useRouter } from "next/router";
import { useGetMissionQuery } from "../../../../store/api/missionApi";
import BaseLoader from "../../../../components/shared/base/BaseLoader";
import { useMissionLogs } from "../../../../hooks/missions/useMissionLogs";
import MissionDashboard from "../../../../components/Missions/MissionDashboard";

const MissionHUD = () => {
    const router = useRouter();
    const { workspaceId, missionId } = router.query;
    const { data: mission, isLoading, isError } = useGetMissionQuery(missionId as string, {
        skip: !missionId,
    });

    const { logs, viewportRef } = useMissionLogs(missionId as string, mission);

    if (isLoading) return <BaseLoader />;
    if (isError || !mission) return <Container py="xl"><Alert color="red" title="Error">Mission not found.</Alert></Container>;

    return (
        <MissionDashboard 
            mission={mission} 
            workspaceId={workspaceId as string} 
            logs={logs} 
            viewportRef={viewportRef} 
        />
    );
};

export const getServerSideProps = withAuth(async () => {
    return {
        props: {},
    };
});

MissionHUD.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default MissionHUD;

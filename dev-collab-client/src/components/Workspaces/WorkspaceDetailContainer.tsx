import { useRouter } from "next/router";
import BaseLoader from "../shared/base/BaseLoader";
import WorkspaceDetail from "./WorkspaceDetail";
import { useGetWorkspaceByIdQuery } from "../../store/api/workspaceApi";
import { getSingleQueryParam } from "../../utils/navigation/queryParams";
import { skipToken } from "@reduxjs/toolkit/query";
import { isValidParam } from "../../utils/navigation/validators";

const WorkspaceDetailContainer = () => {
  const router = useRouter();
  const workspaceId = getSingleQueryParam(router.query.workspaceId);

  const isReady = isValidParam(workspaceId);
  const {
    data: workspace,
    isLoading,
    isError,
  } = useGetWorkspaceByIdQuery(isReady ? workspaceId : skipToken);

  if (!isReady || !workspace || isLoading || isError) {
    return <BaseLoader />;
  }

  return <WorkspaceDetail workspace={workspace} />;
};

export default WorkspaceDetailContainer;

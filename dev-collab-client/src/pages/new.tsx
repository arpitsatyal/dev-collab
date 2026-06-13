import { GetServerSideProps } from "next";
import { v4 as uuidv4 } from "uuid";

export const getServerSideProps: GetServerSideProps = async () => {
  const roomId = uuidv4();
  return {
    redirect: {
      destination: `/playground?roomId=${roomId}`,
      permanent: false,
    },
  };
};

const NewRoomPage = () => {
  return null;
};

export default NewRoomPage;

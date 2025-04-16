import { Box, Loader } from "@mantine/core";

const Loading = () => {
  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
      }}
    >
      <Loader />
    </Box>
  );
};

export default Loading;

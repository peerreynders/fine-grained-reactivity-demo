export default ({ projectDir }) => {
  return {
    extensions: ['ts'],
    files: ['*.test.ts'],
    require: ['ts-node/register'],
    verbose: true,
  };
};

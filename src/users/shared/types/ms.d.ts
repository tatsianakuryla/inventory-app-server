declare module "ms" {
  export type StringValue = string & {
    __msBrand: never;
  };
  function ms(value: string): number;
  function ms(value: number, options?: { long: boolean }): string;
  export default ms;
}

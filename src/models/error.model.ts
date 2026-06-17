export class ProblemDocument extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail: string,
    public type: string = "about:blank",
    public instance?: string,
  ) {
    super(detail);
  }
}

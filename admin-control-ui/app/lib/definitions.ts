// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.


export type PrintResponse = {
  success: boolean;
  successMessage: string;
  failureMessage: string;
};

export type PlanogramData = {
  kit_upc: string;
  pos_col: number;
  pos_row: number;
  lens_upc: string;
  lens_desc: string;
  cfg_line_id: string;
  ws_name: string;
};

export type Planogram = {
  data: PlanogramData[];
};

export type PlanogramSelectedCell = {
  pos_col: number;
  pos_row: number;
  cfg_line_id: string;
  ws_name: string
};

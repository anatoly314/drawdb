import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';
import { nanoid } from 'nanoid';

@Injectable()
export class AddTypeTool {
  private readonly logger = new Logger(AddTypeTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'add_type',
    description:
      'Add a new custom composite TYPE to the diagram (PostgreSQL). Custom types define structured data types with multiple fields, similar to structs or objects.',
    parameters: z.object({
      name: z.string().describe('Type name (e.g., "address_type", "contact_info")'),
      fields: z
        .array(
          z.object({
            name: z.string().describe('Field name'),
            type: z.string().describe('Field data type'),
          }),
        )
        .optional()
        .describe('Array of fields for the composite type'),
      comment: z.string().optional().describe('Optional comment/description for the type'),
    }),
  })
  async addType(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      const typeId = nanoid();
      const typeData = {
        id: typeId,
        name: input.name,
        fields: input.fields || [],
        comment: input.comment || '',
      };

      await context.reportProgress({ progress: 50, total: 100 });

      await this.drawdbClient.sendCommand('addType', {
        data: typeData,
        addToHistory: true,
      });

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Type "${input.name}" added successfully`);

      return {
        success: true,
        message: `Type "${input.name}" added successfully with ${(input.fields || []).length} fields`,
        typeId,
        name: input.name,
        fields: input.fields || [],
      };
    } catch (error) {
      this.logger.error('Failed to add type', error);
      throw error;
    }
  }
}

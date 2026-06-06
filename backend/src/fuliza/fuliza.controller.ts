import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FulizaService } from './fuliza.service';
import { InitiateBoostDto } from './fuliza.dto';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('fuliza')
export class FulizaController {
  constructor(private fuliza: FulizaService) {}

  @Get('limits')
  getLimits() {
    return this.fuliza.getLimits();
  }

  @UseGuards(JwtGuard)
  @Post('initiate')
  initiateBoost(@Request() req: any, @Body() dto: InitiateBoostDto) {
    return this.fuliza.initiateBoost(req.user.userId, dto);
  }

  @Post('callback')
  handleCallback(@Body() body: any) {
    return this.fuliza.handleCallback(body);
  }

  @UseGuards(JwtGuard)
  @Get('status/:checkoutRequestId')
  getStatus(@Param('checkoutRequestId') id: string, @Request() req: any) {
    return this.fuliza.getStatus(id, req.user.userId);
  }

  @UseGuards(JwtGuard)
  @Get('history')
  getHistory(@Request() req: any) {
    return this.fuliza.getHistory(req.user.userId);
  }
}

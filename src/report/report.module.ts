import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { LocalStorageModule } from '../local-storage/local-storage.module';

@Module({
  imports: [LocalStorageModule],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}

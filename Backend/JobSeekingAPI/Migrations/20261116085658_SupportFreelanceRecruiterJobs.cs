using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobSeekingAPI.Migrations
{
    /// <inheritdoc />
    public partial class SupportFreelanceRecruiterJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS fk_jobs_companies_companyid;
                ALTER TABLE public.jobs ALTER COLUMN companyid DROP NOT NULL;
                ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS postedbyuserid integer NULL;
                CREATE INDEX IF NOT EXISTS ix_jobs_postedbyuserid ON public.jobs (postedbyuserid);
                ALTER TABLE public.jobs ADD CONSTRAINT fk_jobs_companies_companyid 
                    FOREIGN KEY (companyid) REFERENCES public.companies (companyid) ON DELETE SET NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_jobs_companies_companyid",
                table: "jobs");

            migrationBuilder.DropIndex(
                name: "ix_jobs_postedbyuserid",
                table: "jobs");

            migrationBuilder.DropColumn(
                name: "postedbyuserid",
                table: "jobs");

            migrationBuilder.AlterColumn<int>(
                name: "companyid",
                table: "jobs",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "createdat",
                table: "companyjoinrequests",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AddForeignKey(
                name: "fk_jobs_companies_companyid",
                table: "jobs",
                column: "companyid",
                principalTable: "companies",
                principalColumn: "companyid",
                onDelete: ReferentialAction.Restrict);
        }
    }
}

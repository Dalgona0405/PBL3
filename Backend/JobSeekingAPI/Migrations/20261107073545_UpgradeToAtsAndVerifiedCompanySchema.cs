using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace JobSeekingAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpgradeToAtsAndVerifiedCompanySchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE recruiters DROP CONSTRAINT IF EXISTS fk_recruiters_companies_companyid;");

            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_applications_jobid;");

            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_applications_status;");

            migrationBuilder.AddColumn<string>(
                name: "googleid",
                table: "users",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "companyid",
                table: "recruiters",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "requirement",
                table: "jobs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "description",
                table: "jobs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "benefits",
                table: "jobs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "isverified",
                table: "companies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "masteruserid",
                table: "companies",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "taxcode",
                table: "companies",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "verifiedat",
                table: "companies",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "aimatchscore",
                table: "applications",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "aiscorebreakdown",
                table: "applications",
                type: "jsonb",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "interviews",
                columns: table => new
                {
                    interviewid = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    applicationid = table.Column<int>(type: "integer", nullable: false),
                    scheduledat = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    endat = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    interviewtype = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    meetinglink = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    location = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    calendareventuid = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    createdat = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_interviews", x => x.interviewid);
                    table.ForeignKey(
                        name: "fk_interviews_applications_applicationid",
                        column: x => x.applicationid,
                        principalTable: "applications",
                        principalColumn: "appid",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    messageid = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    senderid = table.Column<int>(type: "integer", nullable: false),
                    receiverid = table.Column<int>(type: "integer", nullable: false),
                    jobid = table.Column<int>(type: "integer", nullable: true),
                    content = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    isread = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    sentat = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_messages", x => x.messageid);
                    table.ForeignKey(
                        name: "fk_messages_jobs_jobid",
                        column: x => x.jobid,
                        principalTable: "jobs",
                        principalColumn: "jobid",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_messages_users_receiverid",
                        column: x => x.receiverid,
                        principalTable: "users",
                        principalColumn: "userid",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_messages_users_senderid",
                        column: x => x.senderid,
                        principalTable: "users",
                        principalColumn: "userid",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_users_googleid",
                table: "users",
                column: "googleid",
                unique: true,
                filter: "googleid IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_jobs_status_posteddate",
                table: "jobs",
                columns: new[] { "status", "posteddate" });

            migrationBuilder.CreateIndex(
                name: "ix_companies_masteruserid",
                table: "companies",
                column: "masteruserid");

            migrationBuilder.CreateIndex(
                name: "ix_applications_jobid_status",
                table: "applications",
                columns: new[] { "jobid", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_interviews_applicationid",
                table: "interviews",
                column: "applicationid");

            migrationBuilder.CreateIndex(
                name: "ix_messages_conversation_timeline",
                table: "messages",
                columns: new[] { "senderid", "receiverid", "sentat" });

            migrationBuilder.CreateIndex(
                name: "ix_messages_jobid",
                table: "messages",
                column: "jobid");

            migrationBuilder.CreateIndex(
                name: "ix_messages_receiverid",
                table: "messages",
                column: "receiverid");

            migrationBuilder.AddForeignKey(
                name: "fk_companies_users_masteruserid",
                table: "companies",
                column: "masteruserid",
                principalTable: "users",
                principalColumn: "userid",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_recruiters_companies_companyid",
                table: "recruiters",
                column: "companyid",
                principalTable: "companies",
                principalColumn: "companyid",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_companies_users_masteruserid",
                table: "companies");

            migrationBuilder.DropForeignKey(
                name: "fk_recruiters_companies_companyid",
                table: "recruiters");

            migrationBuilder.DropTable(
                name: "interviews");

            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropIndex(
                name: "ix_users_googleid",
                table: "users");

            migrationBuilder.DropIndex(
                name: "ix_jobs_status_posteddate",
                table: "jobs");

            migrationBuilder.DropIndex(
                name: "ix_companies_masteruserid",
                table: "companies");

            migrationBuilder.DropIndex(
                name: "ix_applications_jobid_status",
                table: "applications");

            migrationBuilder.DropColumn(
                name: "googleid",
                table: "users");

            migrationBuilder.DropColumn(
                name: "isverified",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "masteruserid",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "taxcode",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "verifiedat",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "aimatchscore",
                table: "applications");

            migrationBuilder.DropColumn(
                name: "aiscorebreakdown",
                table: "applications");

            migrationBuilder.AlterColumn<int>(
                name: "companyid",
                table: "recruiters",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "requirement",
                table: "jobs",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "description",
                table: "jobs",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "benefits",
                table: "jobs",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_applications_jobid",
                table: "applications",
                column: "jobid");

            migrationBuilder.CreateIndex(
                name: "ix_applications_status",
                table: "applications",
                column: "status");

            migrationBuilder.AddForeignKey(
                name: "fk_recruiters_companies_companyid",
                table: "recruiters",
                column: "companyid",
                principalTable: "companies",
                principalColumn: "companyid",
                onDelete: ReferentialAction.Restrict);
        }
    }
}

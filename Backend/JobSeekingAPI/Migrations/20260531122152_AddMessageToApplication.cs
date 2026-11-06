using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobSeekingAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageToApplication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            //migrationBuilder.DropIndex(
            //    name: "ix_applications_userid_jobid_unique",
            //    table: "applications");

            migrationBuilder.AlterColumn<DateTime>(
                name: "posteddate",
                table: "jobs",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "GETDATE()");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "applications",
                type: "integer",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<DateTime>(
                name: "applieddate",
                table: "applications",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "GETDATE()");

            migrationBuilder.AddColumn<string>(
                name: "message",
                table: "applications",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_applications_userid_jobid_unique",
                table: "applications",
                columns: new[] { "userid", "jobid" },
                unique: true,
                filter: "deletedat IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_applications_userid_jobid_unique",
                table: "applications");

            migrationBuilder.DropColumn(
                name: "message",
                table: "applications");

            migrationBuilder.AlterColumn<DateTime>(
                name: "posteddate",
                table: "jobs",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "GETDATE()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "applications",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1);

            migrationBuilder.AlterColumn<DateTime>(
                name: "applieddate",
                table: "applications",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "GETDATE()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.CreateIndex(
                name: "ix_applications_userid_jobid_unique",
                table: "applications",
                columns: new[] { "userid", "jobid" },
                unique: true,
                filter: "[DeletedAt] IS NULL");
        }
    }
}

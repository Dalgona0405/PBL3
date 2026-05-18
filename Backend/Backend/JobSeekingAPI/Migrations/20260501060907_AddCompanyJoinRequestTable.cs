using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace JobSeekingAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyJoinRequestTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "companyjoinrequests",
                columns: table => new
                {
                    requestid = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    userid = table.Column<int>(type: "integer", nullable: false),
                    companyid = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    createdat = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_companyjoinrequests", x => x.requestid);
                    table.ForeignKey(
                        name: "fk_companyjoinrequests_companies_companyid",
                        column: x => x.companyid,
                        principalTable: "companies",
                        principalColumn: "companyid",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_companyjoinrequests_recruiters_userid",
                        column: x => x.userid,
                        principalTable: "recruiters",
                        principalColumn: "userid",
                        onDelete: ReferentialAction.Cascade);
                });

            // Tạo Index cho các khóa ngoại để truy vấn nhanh hơn
            migrationBuilder.CreateIndex(
                name: "ix_companyjoinrequests_companyid",
                table: "companyjoinrequests",
                column: "companyid");

            migrationBuilder.CreateIndex(
                name: "ix_companyjoinrequests_userid",
                table: "companyjoinrequests",
                column: "userid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "companyjoinrequests");
        }
    }
}
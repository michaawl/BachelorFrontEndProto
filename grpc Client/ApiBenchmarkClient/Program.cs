using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        while (true)
        {
            Console.WriteLine("\n ##### API Auswählen: 1, 2, 3, 4, 5 ##### ");
            Console.WriteLine("1) REST");
            Console.WriteLine("2) GraphQL");
            Console.WriteLine("3) gRPC");
            Console.WriteLine("4) gRPC-Web");
            Console.WriteLine("5) Exit");
            Console.Write("Select API type: ");
            var input = Console.ReadLine();

            switch (input)
            {
                case "1":
                    await RestBenchmarker.RunMenuAsync();
                    break;
                case "2":
                    await GraphQlBenchmarker.RunMenuAsync();
                    break;
                case "3":
                    await GrpcBenchmarker.RunMenuAsync();
                    break;
                case "4":
                    await GrpcWebBenchmarker.RunMenuAsync();
                    break;
                case "5":
                    return;
                default:
                    Console.WriteLine("Invalid selection.\n");
                    break;
            }
        }
    }
}

using Google.Protobuf;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Grpc.Net.Client;
using GrpcWebApi.Protos;
using System;
using System.Diagnostics;

public static class GrpcBenchmarker
{
    private const string GrpcUrl = "https://localhost:7178";

    public static async Task RunMenuAsync()
    {
        var baseHandler = new HttpClientHandler();
        var handler = new LoggingHandler { InnerHandler = baseHandler };

        using var channel = GrpcChannel.ForAddress(GrpcUrl);

        var textClient = new Text.TextClient(channel);
        var mediaClient = new Media.MediaClient(channel);
        var blogClient = new Blog.BlogClient(channel);
        var empty = new Empty();

        while (true)
        {
            Console.WriteLine("\n##### gRPC Benchmark #####");
            Console.WriteLine("1) Text");
            Console.WriteLine("2) Media");
            Console.WriteLine("3) Blog");
            Console.WriteLine("Type exit to go back");
            Console.Write("Select resource: ");

            var choice = Console.ReadLine()?.Trim().ToLower();
            if (choice == "exit")
                return;

            switch (choice)
            {
                case "1": await BenchmarkTextAsync(textClient, empty); break;
                case "2": await BenchmarkMediaAsync(mediaClient, empty); break;
                case "3": await BenchmarkBlogAsync(blogClient, empty); break;
                default: Console.WriteLine("Invalid selection.\n"); break;
            }
        }
    }

    private static async Task BenchmarkTextAsync(Text.TextClient client, Empty empty)
    {
        while (true)
        {
            Console.WriteLine(" Text size? 1) Small  2) Medium  3) Large");
            Console.WriteLine("Type exit to go back");
            Console.Write(" Select text size: ");
            var key = Console.ReadLine()?.Trim().ToLower();

            if (key == "exit")
                return;

            var call = key 
                switch
            {
                "1" => client.GetSmallAsync(empty).ResponseAsync,
                "2" => client.GetMediumAsync(empty).ResponseAsync,
                "3" => client.GetLargeAsync(empty).ResponseAsync,
                _ => null
            };

            if (call == null)
            {
                Console.WriteLine("Invalid selection.\n");
                continue;
            }

            var sw = Stopwatch.StartNew();
            var resp = await call;
            sw.Stop();

            var bytes = System.Text.Encoding.UTF8.GetByteCount(resp.Content);
            Console.WriteLine($"gRPC Text({key}): {bytes} bytes in {sw.ElapsedMilliseconds} ms\n");
        }
    }

    private static async Task BenchmarkMediaAsync(Media.MediaClient client, Empty empty)
    {
        while (true)
        {
            Console.WriteLine(" Media type? 1) Image  2) Audio  3) Video");
            Console.WriteLine("Type exit to go back");
            Console.Write(" Select media type: ");

            var key = Console.ReadLine()?.Trim().ToLower();
            if (key == "exit")
                return;

            AsyncServerStreamingCall<Chunk> call = key switch
            {
                "1" => client.GetImage(empty),
                "2" => client.GetAudio(empty),
                "3" => client.GetVideo(empty),
                _ => null
            };

            if (call == null)
            {
                Console.WriteLine("Invalid selection.\n");
                continue;
            }

            var sw = Stopwatch.StartNew();
            var totalBytes = 0;

            try
            {
                await foreach (var chunk in call.ResponseStream.ReadAllAsync())
                {
                    totalBytes += chunk.Data.Length;
                }
            }
            catch (RpcException ex)
            {
                Console.WriteLine($"Error during streaming: {ex.Message}");
                continue;
            }

            sw.Stop();

            Console.WriteLine($"gRPC Media({key}): {totalBytes} bytes streamed in {sw.ElapsedMilliseconds} ms\n");
        }
    }

    private static async Task BenchmarkBlogAsync(Blog.BlogClient client, Empty empty)
    {
        while (true)
        {
            Console.WriteLine("Type exit or go back");
            Console.Write("Want to fetch blog?\n");
            var key = Console.ReadLine()?.Trim().ToLower();
            if (key == "exit") return;

            var sw = Stopwatch.StartNew();
            var resp = await client.GetAllAsync(empty);
            sw.Stop();

            var protoBytes = resp.ToByteArray().Length;
            Console.WriteLine($"gRPC Blog(All): {resp.Posts.Count} posts, {protoBytes} bytes in {sw.ElapsedMilliseconds} ms\n");
        }
    }

    private class LoggingHandler : DelegatingHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken token)
        {
            var response = await base.SendAsync(request, token);
            Console.WriteLine(new string('-', 40));
            Console.WriteLine($"REQ  {request.Method} {request.RequestUri.PathAndQuery}  v{request.Version}");
            if (request.Content?.Headers.ContentType != null)
                Console.WriteLine($"     req-CT: {request.Content.Headers.ContentType}");
            Console.WriteLine($"RESP {(int)response.StatusCode}  v{response.Version}");
            if (response.Content?.Headers.ContentType != null)
                Console.WriteLine($"     resp-CT: {response.Content.Headers.ContentType}");
            Console.WriteLine(new string('-', 40));

            return response;
        }
    }
}